import express from "express";
import * as db from "./database.js";
import * as q from "./queue.js";
import cors from "cors";
import bodyParser from "body-parser";
import * as st from "@repo/types" 
import { Ollama } from 'ollama';
import dotenv from "dotenv";

dotenv.config();

const ollama = new Ollama({ host: process.env.OLLAMA_URL });
const ollamaModels : st.Model[] = (await ollama.list()).models.map(m => ({
	...m,
	id: m.model,
	name: m.name,
	provider: "ollama",
	disabled: false,
	default: m.model.includes("deepseek")
}))

const ollamaProvider: st.Provider = {
	id: "ollama",
	name: "Ollama",
	models: ollamaModels
}
const providers = [
	ollamaProvider
]

const models = [
	...ollamaModels
]

const app = express();
if (process.env.EXPRESS_TRUST_PROXY === "true") {
	app.enable("trust proxy")
}

/** MIdDLEWARE **/
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, _, next) => {
	console.log(`${req.method} ${req.url.split("?")[0]}`);
	next();
});

let currentSessionId = 0;
function generateSessionId() {
	return currentSessionId++;
}

app.post("/validations", async (req, res) => {
	const vr = req.body.validationRequest as unknown as st.ValidationRequest;
	const sessionId = req.body.sessionId || generateSessionId();
	const { id } = await q.addJob(vr, sessionId);
	res.json({ jobId: id });
});

app.get("/validations", async (req, res) => {
	const populate = (req.query.populate as unknown as boolean) || false;
	return res.json(await db.getValidations(populate));
});

app.get("/validations/:databaseId", async (req, res) => {
	const databaseId = req.params.databaseId as string;
	const populate = (req.query.populate as unknown as boolean) || false;
	let json;
	try {
		json = await db.getValidation(databaseId, populate);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
	res.json(json);
});

app.get("/session", async (_, res) => res.json({ sessionId: generateSessionId() }));

app.get("/session/:sessionId", async (req, res) => {
	const sessionId = req.params.sessionId as string;
	const populate = (req.query.populate as unknown as boolean) || false;
	const jobs = await q.getJobsWithSessionId(sessionId);

	const statuses: Array<Promise<object>> = jobs.map(async job => {
		const res = {
			jobId: job.id as string,
			status: (await job.getState()) as string,
			_id: job?.returnvalue?._id as string,
			result: {
				verdict: job?.returnvalue?.result?.verdict,
			},
			queueOrder: (await q.getJobOrdering()).get(job.id),
		};
		return populate ? { ...res, ...job.data.validationRequest } : res;
	});
	return res.json(await Promise.all(statuses));
});

app.get("/job/:jobId", async (req, res) => {
	const jobId = req.params.jobId as string;
	res.json(await q.getJobWithId(jobId));
});

app.get("/models", (_, res) => {
	res.json(models as st.Model[]);
});

app.get("/", (_, res) => {
	res.sendStatus(200);
});
/* START */
// const base64cert = sslOptions.letsencrypt.Certificates[0].certificate;
// const base64key = sslOptions.letsencrypt.Certificates[0].key;
// const cert = Buffer.alloc(Math.ceil(base64cert.length * 0.75), base64cert, "base64").toString(); // Ta-da
// console.log(cert)
// const key = Buffer.alloc(Math.ceil(base64key.length * 0.75), base64key, "base64").toString(); // Ta-da
// console.log(key)
// app.listen(port, () => {
// 	console.log(`api live @ localhost:${port}`);
// });
const PORT = Number(process.env.PORT);
const onListen = () => console.log(`api live @ http://localhost:${PORT}`);
// if (NODE_ENV === "dev") {
app.listen(PORT, onListen);
// } else {

// https.createServer({ cert: fs.readFileSync("ssl/cert.pem"), key: fs.readFileSync("ssl/key.pem") }, app).listen(port, onListen);
// }
// console.log(__dirname);

// require("greenlock-express").init({packageRoot: ".", configDir: "greenlock/", cluster: false, maintainerEmail: "timm02@vse.cz"}).serve(app);

// app.get("/log", async (req, res) => {
// 	// res.writeHead(200, {
// 	// 	// "content-type": "text/event-stream",
// 	// 	"cache-control": "no-cache",
// 	// 	connection: "keep-alive",
// 	// });
// 	res.json({ log: "log" });
// });

// function requestLogger(req, _, next) {}
// app.get("/validateWikidata", (req, res) => {
// 	if (isEvaluating) {
// 		res.sendStatus(429);
// 		console.log("Responded with 429");
// 		return;
// 	} else {
// 		isEvaluating = true;
// 	}

// 	const subjectId = req.query.subjectId as string;
// 	if (!subjectId.match(/[0-9]+/)) {
// 		res.sendStatus(400);
// 		isEvaluating = false;
// 		return;
// 	}

// 	const provider = req.query.provider as string;
// 	const model = req.query.model as string;
// 	const temperature = req.query.temperature as unknown as number;

// 	res.writeHead(200, {
// 		"content-type": "text/event-stream",
// 		"cache-control": "no-cache",
// 		connection: "keep-alive",
// 	});

// 	validateWikidata(subjectId, {}, message => {
// 		if (message.type === "stream") {
// 			let data = message.data;

// 			if (data.startsWith(xmlPrefix)) {
// 				data = data.substr(xmlPrefix.length);
// 				db.storeQuery({
// 					provider
// 					model,
// 					subjectId,
// 					temperature,
// 					xml: data,
// 				});
// 			}
// 			res.write(createSSE("xml", data));
// 		} else if (message.type === "success" || message.type === "error") {
// 			res.write(createSSE("eos", message.type));
// 			isEvaluating = false;
// 		} else {
// 			res.write(createSSE("log", message.data));
// 		}
// 	});
// });

// function createSSE(eventName: string, eventData: string) {
// 	return `id: ${eventName}\r\ndata: ${eventData}\n\n`;
// }

// app.get("/uids", async (_, res) => {
// 	const uids = await db.getUIds();
// 	res.json(uids);
// });

// app.get("/query", async (req, res) => {
// 	const uid = req.query.uid as string;
// 	const query = await db.getQuery(uid);
// 	res.json(query);
// });

// function sendTestSSE(_, res) {
// 	console.log("sent dummy data");
// 	let i = 0;
// 	res.writeHead(200, {
// 		"content-type": "text/event-stream",
// 		"cache-control": "no-cache",
// 		connection: "keep-alive",
// 	});
// 	const interval = setInterval(() => {
// 		if (i < 2) res.write(createSSE("log", "dummy log: " + i));
// 		if (i === 2) {
// 			res.write(createSSE("xml", testXML()));
// 			db.storeQuery({
// 				uid: "Q0Mno-modelT0.9",
// 				model: "no-model",
// 				subjectId: 0,
// 				temperature: 0.9,
// 				xml: testXML(),
// 			});
// 		}
// 		if (i === 3) {
// 			clearInterval(interval);
// 			res.write(createSSE("eos", "success"));
// 			isEvaluating = false;
// 		}
// 		i++;
// 	}, 300);
// }
