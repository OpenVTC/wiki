Quartz comes shipped with a Docker image that will allow you to preview your Quartz locally without installing Node.

You can run the below one-liner to run Quartz in Docker.

```sh
docker run --rm -it -p 127.0.0.1:8080:8080 -p 127.0.0.1:3001:3001 -v ./content:/usr/src/app/content $(docker build -q .)
```

The server inside the container listens on all of the container's interfaces, so the ports above are published on `127.0.0.1` only. Drop the `127.0.0.1:` prefix if you want other machines on your network to reach the preview.

> [!warning] Not to be used for production
> Serve mode is intended for local previews only.
> For production workloads, see the page on [[hosting]].
