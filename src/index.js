const Fastify = require("fastify");
const Fs = require("fs");
const Path = require("path");
const Cors = require("@fastify/cors");
const MongoDB = require("../utility/mongodb");

class WebServer {
  constructor(opts = {}) {
    this.$opts = opts;
    this.$webServer = Fastify({
      trustProxy: true,
    });
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
    this._loadRoutes(routesPath);
  }

  _loadRoutes(filePath) {
    // 해당 path의 파일이 directory인지 확인
    const isDirectory = Fs.lstatSync(filePath).isDirectory();

    if (isDirectory) {
      // directory이면 해당 directory의 파일들을 가져옴
      const subFiles = Fs.readdirSync(filePath);

      for (const filename of subFiles) {
        const subFilePath = Path.join(filePath, filename);

        // 함수 본인을 재실행함
        this._loadRoutes(subFilePath);
      }
    } else {
      // 폴더가 아니면 endpoint를 가져오는 로직
      const routes = require(filePath);

      for (const routeEndpoint of Object.keys(routes)) {
        const routeDef = routes[routeEndpoint];
        const [method, path] = routeEndpoint.split(" ");

        const options = {
          preHandler: async (req, rep, done) => {
            const middlewares = routeDef.middlewares ?? [];

            for (const middlewareName of middlewares) {
              if (middlewareName in this.$middlewares) {
                const middleware = this.$middlewares[middlewareName];
                if (middleware) {
                  const middlewareResult = await middleware(req, rep);
                  if (middlewareResult instanceof Error) {
                    return done(middlewareResult);
                  }
                }
              }
            }
          },
        };

        const routesIndex = filePath.indexOf("routes/");
        const getPath = filePath.substring(routesIndex + 7);

        const versionCheck = getPath.indexOf("/");
        const fileRoutePath = getPath.slice(0, -3);

        if (versionCheck === -1) {
          const endpoint = `/${fileRoutePath}${path}`;
          this.$webServer[method.toLowerCase()](
            endpoint,
            options,
            routeDef.handler
          );
        }

        if (versionCheck !== -1) {
          const splitFileRoutePath = fileRoutePath.split("\\");
          const endpoint = "/" + splitFileRoutePath.join("/") + path;
          this.$webServer[method.toLowerCase()](
            endpoint,
            options,
            routeDef.handler
          );
        }
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
