import test, { after, before, describe } from "node:test"
import assert from "node:assert"
import { spawn, type ChildProcess } from "node:child_process"
import fs from "node:fs"
import net from "node:net"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Runs the real `quartz build --serve` preview server and drives it over raw sockets, because an
// HTTP client collapses `..` out of a request target before it ever leaves the process and the
// point here is what the server does with a target that still has it. Covers the two preview
// server issues: the listener bound every interface while the banner claimed localhost, and the
// redirect probes ran `fs.existsSync` on the un-normalized request path, which answered whether a
// file outside the output directory existed.
//
// Every address this test connects to is an address of the machine it runs on -- loopback, or one
// reported by os.networkInterfaces(). Nothing here reaches the network, with the fix in place or
// without it.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const fixtureDir = path.join(repoRoot, "quartz", "cli", "fixtures", "serve")

// A scratch root holding the served directory plus two siblings of it, so `/../<name>/` aims an
// existence probe out of the web root. One sibling exists and one never does: before the fix that
// difference was visible in the response, and that difference is the oracle.
const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "quartz-serve-test-"))
const outputDir = path.join(scratchRoot, "site")
const presentName = "outside-present"
const absentName = "outside-absent"

const ansi = /\x1b\[[\d;]*m/g

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.on("error", reject)
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as net.AddressInfo
      probe.close(() => resolve(port))
    })
  })
}

// Whether a TCP connection to this address is answered. A timeout counts as unreachable: a
// filtered address is not serving either.
function connects(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port })
    const settle = (reachable: boolean) => {
      socket.destroy()
      resolve(reachable)
    }
    socket.setTimeout(5_000)
    socket.on("timeout", () => settle(false))
    socket.on("connect", () => settle(true))
    socket.on("error", () => settle(false))
  })
}

// Sends the request target verbatim and returns the whole response. Writes without ending the
// socket: a half-close makes Node's server tear the connection down before it replies, so
// `socket.end(request)` would read back an empty response for every target and the status
// assertions below would all compare NaN. `Connection: close` is what ends the exchange.
function request(port: number, target: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: "127.0.0.1", port })
    let response = ""
    socket.setTimeout(20_000)
    socket.on("timeout", () => socket.destroy(new Error(`timed out requesting ${target}`)))
    socket.on("connect", () => {
      socket.write(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\n\r\n`)
    })
    socket.on("data", (chunk) => (response += chunk))
    socket.on("error", reject)
    socket.on("close", () => resolve(response))
  })
}

function statusLine(response: string): string {
  return response.slice(0, response.indexOf("\r\n"))
}

function status(response: string): number {
  return Number(statusLine(response).split(" ")[1])
}

// Addresses this machine answers on that are not loopback. Anything reachable on one of these is
// reachable by anyone who can route to the machine.
function offLoopbackAddresses(): string[] {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface !== undefined && !iface.internal && iface.family === "IPv4")
    .map((iface) => iface!.address)
}

// `listen(port)` with no host binds `::`, which answers on `::1` and on every other interface;
// `listen(port, "127.0.0.1")` answers on 127.0.0.1 and nowhere else. So a refusal on `::1` is
// what tells the two apart -- but only where `::1` works at all, which this checks first, so a
// machine with IPv6 off cannot turn the probe into a free pass.
function ipv6LoopbackWorks(): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer()
    probe.on("error", () => resolve(false))
    probe.listen(0, "::1", async () => {
      const { port } = probe.address() as net.AddressInfo
      const reachable = await connects("::1", port)
      probe.close(() => resolve(reachable))
    })
  })
}

describe("preview server", () => {
  let server: ChildProcess
  let port = 0
  let wsPort = 0
  let banner = ""

  before(async () => {
    fs.mkdirSync(scratchRoot, { recursive: true })
    fs.writeFileSync(path.join(scratchRoot, `${presentName}.html`), "<p>not part of the site</p>")
    fs.rmSync(path.join(scratchRoot, `${absentName}.html`), { force: true })

    port = await freePort()
    wsPort = await freePort()

    // No --host: the point is what the default does.
    //
    // Its own process group, so teardown takes the build workers with it rather than leaving
    // them holding the ports.
    server = spawn(
      process.execPath,
      [
        "./quartz/bootstrap-cli.mjs",
        "build",
        "--serve",
        "-d",
        fixtureDir,
        "-o",
        outputDir,
        "--port",
        String(port),
        "--wsPort",
        String(wsPort),
      ],
      { cwd: repoRoot, detached: true, env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } },
    )

    banner = await new Promise<string>((resolve, reject) => {
      let output = ""
      const timer = setTimeout(
        () => reject(new Error(`preview server did not start:\n${output}`)),
        180_000,
      )
      const done = (error: Error) => {
        clearTimeout(timer)
        reject(error)
      }
      const read = (chunk: Buffer) => {
        output += chunk.toString().replace(ansi, "")
        const started = output.match(/Started a Quartz server listening at (\S+)/)
        if (started) {
          clearTimeout(timer)
          resolve(started[1])
        }
      }
      server.stdout?.on("data", read)
      server.stderr?.on("data", read)
      server.on("error", done)
      server.on("exit", (code) => done(new Error(`preview server exited with ${code}:\n${output}`)))
    })
  })

  after(() => {
    if (server?.pid !== undefined) {
      try {
        process.kill(-server.pid, "SIGKILL")
      } catch {
        server.kill("SIGKILL")
      }
    }
    fs.rmSync(scratchRoot, { recursive: true, force: true })
  })

  test("serves the fixture site", async () => {
    assert.strictEqual(status(await request(port, "/")), 200)
    // serve-handler redirects an explicit /index to /
    assert.strictEqual(status(await request(port, "/index")), 301)
    assert.strictEqual(status(await request(port, "/nested/page")), 200)
    assert.strictEqual(status(await request(port, "/no-such-page")), 404)

    // `/../` normalizes back to the site root, so it is served rather than refused. Asserted
    // because it is the difference between normalizing the request path and rejecting every
    // path that merely contains `..`: a blanket reject would pass the traversal tests below
    // while breaking this.
    assert.strictEqual(status(await request(port, "/../")), 200)
  })

  test("the banner reports the address the socket is bound to", () => {
    // Was a hardcoded `http://localhost:PORT` printed before listen() resolved, which said
    // loopback while the socket was on every interface.
    assert.strictEqual(banner, `http://127.0.0.1:${port}`)
  })

  test("the server and the hot-reload socket answer on loopback only", async () => {
    assert.ok(await connects("127.0.0.1", port), "the server does not answer on 127.0.0.1")
    assert.ok(
      await connects("127.0.0.1", wsPort),
      "the hot-reload socket does not answer on 127.0.0.1",
    )

    const offLimits = offLoopbackAddresses()
    if (await ipv6LoopbackWorks()) offLimits.push("::1")
    assert.ok(
      offLimits.length > 0,
      "no address left to probe, so this cannot tell a loopback bind from a wildcard one",
    )

    // Keeps the probes on this machine even if the list above is ever edited.
    const ownAddresses = new Set([
      ...Object.values(os.networkInterfaces())
        .flat()
        .map((iface) => iface?.address),
      "127.0.0.1",
      "::1",
    ])
    for (const address of offLimits) {
      assert.ok(ownAddresses.has(address), `${address} is not an address of this machine`)
    }

    for (const address of offLimits) {
      assert.strictEqual(
        await connects(address, port),
        false,
        `the server answers on ${address}, not just loopback`,
      )
      assert.strictEqual(
        await connects(address, wsPort),
        false,
        `the hot-reload socket answers on ${address}, not just loopback`,
      )
    }
  })

  // The targets below are the ones the guard alone can refuse. `path.posix.join(fp, "index.html")`
  // drops a leading `..` from an absolute path, but `path.posix.join(argv.output, base)` does not,
  // so it is the `/trailing/` branch's `base` probe that escapes -- and when the file it lands on
  // exists, the un-normalized server answered 302. Without the guard these return 302; with it,
  // 400.
  //
  // Deliberately not asserted: `/../outside-absent/`, `/../outside-present`, `/../outside-absent`
  // and `/../../../../../../etc/passwd`. serve-handler refuses all four with a 400 of its own, so
  // asserting 400 on them pins serve-handler and not this guard -- they pass with the guard
  // removed. Measured, not assumed.
  test("request paths that escape the output directory are refused", async () => {
    for (const target of [`/../${presentName}/`, `/nested/../../${presentName}/`]) {
      assert.strictEqual(status(await request(port, target)), 400, `${target} was not refused`)
    }
  })

  test("a refused path does not reveal whether a file outside the root exists", async () => {
    // This is the oracle: without the guard the existing sibling answered 302 and the missing one
    // 400, so the status told the caller which files outside the site were there.
    const present = await request(port, `/../${presentName}/`)
    const absent = await request(port, `/../${absentName}/`)
    assert.strictEqual(statusLine(present), statusLine(absent))
    assert.doesNotMatch(present, /not part of the site/)
  })
})
