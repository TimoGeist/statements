import { computed, reactive, ref, type Ref } from "vue";
import { isEqual } from "lodash";
import * as st from "@repo/types" 

const API_URL = import.meta.env.PUBLIC_API_URL || "http://127.0.0.1:9000";

type ValidationView = Partial<st.SavedValidation> & {
	jobId?: string;
	status: "active" | "waiting" | "failed" | "completed";
	selected: boolean;
	queueOrder: number;
};

const modelsRes = await fetch(API_URL + "/models");
const modelsArr: st.Model[] = await modelsRes.json()
const models: Ref<st.Model[]> = ref(modelsArr)

let initialLoading = ref(true);
let databaseViews = ref<ValidationView[]>([]);
await refreshDatabaseViews();
let sessionViews = reactive<ValidationView[]>([]);
let combinedViews = computed(() => {
	sessionViews
		.filter(sv => sv._id)
		.forEach(sv => {
			const redundantViewIdx = databaseViews.value.findIndex(dbv => dbv._id === sv._id);
			databaseViews.value.splice(redundantViewIdx, 1);
		});
		const final = sessionViews.concat(databaseViews.value) 
		console.log("combinedViews", final)
	return final;
});
initialLoading.value = false;

const sessionId = await initSessionId();
await syncSession();
let doPolling = computed(() => sessionViews.some(v => v.status === "waiting" || v.status === "active"));
setInterval(async () => {
	if (doPolling.value) await refreshSessionValidationViews();
}, 1000);

async function initSessionId() {
	let id = window.localStorage.getItem("sessionId");
	if (!id) {
		const res = await fetch(API_URL + "/session");
		id = (await res.json()).sessionId;
		window.localStorage.setItem("sessionId", id);
	}
	return id;
}

async function refreshDatabaseViews() {
	const res = await fetch(API_URL + "/validations?populate=false");
	const validations = (await res.json()) as st.SavedValidation[];
	const views = validations.map(v => initView({ ...v, status: "completed" }));
	databaseViews.value = views;
	console.log("databaseViews", views)
}

async function enqueue(vr: st.ValidationRequest) {
	if (sessionViews.some(sessionView => isUnique(sessionView as st.ValidationRequest, vr))) {
		return alert("Duplicate request, change your query.");
	}
	const res = await fetch(API_URL + "/validations", {
		headers: { "Content-Type": "application/json" },
		method: "POST",
		body: JSON.stringify({
			validationRequest: vr,
			sessionId,
		}),
	});
	const jobId = (await res.json()).jobId;
	sessionViews.push(initView({ ...vr, jobId, status: "waiting" }));
	console.log("just pushed sessionViews")
}

async function syncSession() {
	const res = await fetch(`${API_URL}/session/${sessionId}?populate=true`);
	const statuses = (await res.json()) as Array<Partial<ValidationView>>;
	statuses.forEach(status => {
		const view = initView(status);
		sessionViews.push(view);
		console.log(status, view);
	});
	console.log("sessionViews", sessionViews);
}

async function refreshSessionValidationViews() {
	const res = await fetch(`${API_URL}/session/${sessionId}?populate=false`);
	const statuses = (await res.json()) as Array<Partial<ValidationView>>;
	statuses.forEach(status => {
		const view = sessionViews.find(view => view.jobId === status.jobId);
		if (view) {
			view._id = status._id;
			view.result.verdict = status.result.verdict;
			view.status = status.status;
			view.queueOrder = status.queueOrder;
		}
		console.log("just refreshed sessionViews", sessionViews)
	});
}

function initView(partial: Partial<ValidationView>) {
	let view = {
		selected: false,
		result: {
			verdict: partial.status !== "completed" ? undefined : partial?.result?.verdict,
		},
	} as ValidationView;
	return { ...view, ...partial };
}

function isUnique(v1: st.ValidationRequest, v2: st.ValidationRequest) {
	return isEqual(v1.modelOptions, v2.modelOptions) && isEqual(v1.statement, v2.statement) && v1.resourceURL === v2.resourceURL;
}

export { models, databaseViews, combinedViews, initialLoading, enqueue, refreshDatabaseViews, refreshSessionValidationViews, API_URL };
