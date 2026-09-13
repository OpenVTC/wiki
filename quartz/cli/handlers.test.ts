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

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const fixtureDir = path.join(repoRoot, "quartz", "cli", "fixtures", "serve")
const cacheDir = path.join(repoRoot, "quartz", ".quartz-cache")
const outputDir = path.join(cacheDir, "serve-test-output")

// Siblings of the output directory, so `/../<name>/` aims an existence probe at them from the
// web root. One exists and one does not: before the fix that difference was visible in the
// response, which is the oracle.
const presentOutside = path.join(cacheDir, "serve-test-present.html")
const absentName = "serve-test-absent"

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

// Sends the request target verbatim and returns the whole response.
function request(port: number, target: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: "127.0.0.1", port })
    let response = ""
    socket.setTimeout(20_000)
    socket.on("timeout", () => socket.destroy(new Error(`timed out requesting ${target}`)))
    socket.on("connect", () => {
      socket.end(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\n\r\n`)
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
    fs.rmSync(outputDir, { recursive: true, force: true })
    fs.mkdirSync(cacheDir, { recursive: true })
    fs.writeFileSync(presentOutside, "<p>not part of the site</p>")
    fs.rmSync(path.join(cacheDir, `${absentName}.html`), { force: true })

    port = await freePort()
    wsPort = await freePort()

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
    fs.rmSync(outputDir, { recursive: true, force: true })
    fs.rmSync(presentOutside, { force: true })
  })

  test("serves the fixture site", async () => {
    assert.strictEqual(status(await request(port, "/")), 200)
    assert.strictEqual(status(await request(port, "/index")), 200)
    assert.strictEqual(status(await request(port, "/nested/page")), 200)
    assert.strictEqual(status(await request(port, "/no-such-page")), 404)
  })

  test("the banner reports the address the socket is bound to", () => {
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

  test("request paths that leave the output directory are refused", async () => {
    const targets = [
      `/../${absentName}/`,
      "/../serve-test-present/",
      "/../serve-test-present",
      "/nested/../../serve-test-present/",
      "/../../../../../../etc/passwd",
    ]
    for (const target of targets) {
      assert.strictEqual(status(await request(port, target)), 400, `${target} was not refused`)
    }
  })

  test("a refused path does not reveal whether the file outside the root exists", async () => {
    // Before the fix these two differed: 302 when the out-of-root file existed and 404 when it
    // did not, which is the whole oracle.
    const present = await request(port, "/../serve-test-present/")
    const absent = await request(port, `/../${absentName}/`)
    assert.strictEqual(statusLine(present), statusLine(absent))
    assert.doesNotMatch(present, /not part of the site/)
  })
})
