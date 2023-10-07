const Fastify = require("fastify");
const Fs = require("fs");
const Path = require("path");
const Cors = require("@fastify/cors");
const MongoDB = require("./mongodb");

class WebServer {
  constructor(opts = {}) {
    this.$opts = opts;
    this.$webServer = Fastify();
    this.$middlewares = {};

    this.$_initMiddlewares();
    this.$_initMongoDB();
    this.$_initRoutes();
  }
  $_initMiddlewares() {
    const middlewaresPath = Path.join(__dirname, "./middlewares");
    const middlewaresFiles = Fs.readdirSync(middlewaresPath);

    for (const filename of middlewaresFiles) {
      const middlewarePath = Path.join(middlewaresPath, filename);
      const middleware = require(middlewarePath);
      this.$middlewares[filename.slice(0, -3)] = middleware;
    }
  }
  async $_initMongoDB() {
    const dbName = "jangsin";
    const mongoDB = await MongoDB.sharedInstance();

    await mongoDB.connect({
      host: "172.16.0.7",
      port: 27017,
      db: dbName,
    });
  }

  $_initRoutes() {
    const routesPath = Path.join(__dirname, "./routes");
    const routeFiles = Fs.readdirSync(routesPath);

    for (const filename of routeFiles) {
      const routePath = Path.join(routesPath, filename);
      const routes = require(routePath);

      for (const routeEndPoint of Object.keys(routes)) {
        const routeDef = routes[routeEndPoint];
        const [method, path] = routeEndPoint.split(" ");
        // TODO : preHandler 가추가
        const options = {
          preHandler: async (req, rep, done) => {
            const middlewares = routeDef.middlewares ?? [];

            for (const middlewareName of middlewares) {
              if (middlewareName in this.$middlewares) {
                const middleware = this.$middlewares[middlewareName];

                const middlewareResult = await middleware(req, rep);
                if (middlewareResult instanceof Error) {
                  return done(middlewareResult);
                }
              }
            }
          },
        };

        // route 내에 저장된 파일 명이 path가 되게 설정
        const getFileName = filename.replaceAll(".js", "");
        const finalPath = `/${getFileName}${path}`;

        this.$webServer[method.toLowerCase()](
          finalPath,
          options,
          routeDef.handler
        );
      }
    }
  }

  start() {
    // TODO : add cors
    this.$webServer.register(Cors, { origin: "*" });

    this.$webServer.listen({
      host: this.$opts.host,
      port: this.$opts.port,
    });

    console.log(`[${new Date().toLocaleString()}] Server Started`);
  }
}

module.exports = WebServer;
