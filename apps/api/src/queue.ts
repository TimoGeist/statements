import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import * as st from "@repo/types" 

import { validate } from "./core-runner.js"
import { findValidation, saveValidation } from "./database.js";
import dotenv from "dotenv" 
dotenv.config()

const [
	REDIS_HOST = "localhost",
	REDIS_PORT = "6379"
] = (process.env.REDIS_URL || "").split(":");

const connection = {
	host: REDIS_HOST,
	port: Number(REDIS_PORT)
};
const validationQueue = new Queue("validation", { connection });
const worker = new Worker("validation", processJob, { connection });
clearQueue(validationQueue);
bindWorkerEvents(worker);

async function processJob(job: Job) {
	const cachedValidation = await findValidation(job.data.validationRequest);
	if (cachedValidation) {
		return cachedValidation;
	}

	const validation = await validate(job.data.validationRequest);
	try {
		return await saveValidation(validation);
	} catch (e) {
		//fix job token ""
		job.moveToFailed(e, job.token || "", true);
		return e;
	}
}

export async function getJobOrdering() {
	return new Map(
		(await validationQueue.getWaiting())
		.sort((a, b) => a.timestamp - b.timestamp)
		.map((job, idx) => [job.id, idx])
	);
}

export async function addJob(validationRequest: st.ValidationRequest, sessionId: string) {
	return await validationQueue.add("validation", { validationRequest, sessionId });
}

export async function getJobsWithSessionId(sessionId: string) {
	const allJobTypes = ["active", "waiting", "delayed", "completed", "failed", "prioritized", "paused"];
	return (await validationQueue.getJobs(allJobTypes as any)).filter(job => job.data.sessionId === sessionId);
}

export async function getJobWithId(jobId: string) {
	return await validationQueue.getJob(jobId);
}

function bindWorkerEvents(worker: Worker) {
	worker.on("ready", () => {
		console.log(`${worker.name} worker ready @ ${REDIS_HOST}:${REDIS_PORT}`);
	});
	worker.on("completed", job => console.log(`${job.id} has completed!`));
	worker.on("failed", (job, err) => console.log(`${job?.id} : ${err.message}`));
}

async function clearQueue(queue: Queue) {
	const cleanableJobTypes = ["active", "completed", "failed", "prioritized", "paused", "delayed", "wait"];
	await queue.drain(true);
	await Promise.all(cleanableJobTypes.map(async jobType => await validationQueue.clean(0, 0, jobType as any)));
	console.log("drained and cleaned queue");
}
