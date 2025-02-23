import { type ChildProcessWithoutNullStreams, spawn } from "child_process";
import * as st from "@repo/types" 

import dotenv from "dotenv" 
dotenv.config()

const { TGI_URL, WEBUI_URL, OLLAMA_URL, PYTHON_COMMAND } = process.env;
let pythonCommand: string = PYTHON_COMMAND || "python";

function getUrl(provider: string) {
	switch (provider) {
		case "replicate": return "replicate";
		case "tgi": 	 		return String(TGI_URL);
		case "webui":  		return String(WEBUI_URL);
		case "ollama": 		return String(OLLAMA_URL);
		default:			 		return String(OLLAMA_URL);
	}
}

function makeArgs(vr: st.ValidationRequest) {
	return [
		"-s",	Object.values(vr.statement).join(","),
		"-t",	String(0.7),
		"-u", vr.resourceURL,
		"-m", vr.modelOptions.id,
		"-p",	vr.modelOptions.provider,
		"-o",	getUrl(vr.modelOptions.provider)
	];
}

export function validate(validationRequest: st.ValidationRequest): Promise<st.Validation> {
	return new Promise((resolve, reject) => {
		const corePath = import.meta.dirname + "/core/__main__.py";
		console.log("corePath", corePath)
		const args = makeArgs(validationRequest);

		const pythonProcess = spawn(
			pythonCommand,
			[corePath, ...args]
		) as ChildProcessWithoutNullStreams;
		console.log("spawning validation process", pythonProcess.spawnargs);

		pythonProcess.on("error", err => {
			console.log("error", err.toString());
			reject({ error: true, type: "process-error", message: err.toString() });
		});

		pythonProcess.stderr.on("data", data => {
			console.log("error", data.toString());
			reject({ error: true, type: "stderr", message: data.toString() });
		});

		pythonProcess.stdout.on("data", message => {
			const messageString = message.toString();
			console.log("message", messageString);

			if (messageString.trim().startsWith("ipc:")) {
				const json = JSON.parse(messageString.substr(4));
				console.log("received stdout JSON data:", json);
				
				const validationResult: st.ValidationResult = {
					verdict: json.verdict,
					explanation: json.explanation
				};

				const validation : st.Validation = {
					...validationRequest,
					result: validationResult
				}

				resolve(validation);
			}
		});
	});
}