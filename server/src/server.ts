import express from "express";
import router from "./routes";
import { serverLogger } from "./utils/serverLogger";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", router);

app.listen(port, () => {
	serverLogger.debug(`Server running at http://localhost:${port}`);
});
