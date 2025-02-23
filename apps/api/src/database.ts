import * as mg from "mongodb"
import * as st from "@repo/types" 
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "localhost:27017";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new mg.MongoClient(mongoUri, {
  serverApi: {
    version: mg.ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

try {
	await client.connect()
	console.log(`connected to mongo db`)
} catch (e) {
	console.error(`couldn't connect to mongodb \n ${e}`)
}

const statements = client.db("statements");
const validations = statements.collection<st.Validation>("validation");
await deleteAll();

export type SavedValidation = mg.WithId<st.Validation>;

const validationDepopFilter = { result: 0 };

export async function saveValidation(v: st.Validation): Promise<SavedValidation | null>	 {
	return new Promise(async (resolve, reject) => {
		try {
			const result : mg.InsertOneResult = await validations.insertOne(v);
			if (!result.acknowledged) reject(null);
			const _id = result.insertedId;
			const savedValidation: SavedValidation = { _id, ...v }
			resolve(savedValidation);
		}
		catch (e) {
			console.error(e)
			reject(null)
		}
	})
} 

export async function findValidation(vr: st.ValidationRequest) : Promise<SavedValidation | null> { 
	return await validations.findOne(vr); 
}

export async function getValidation(id: string, populate: boolean = true): Promise<SavedValidation | null> {
	const projection = populate ? validationDepopFilter : undefined
	const _id = new mg.ObjectId(id)
	const query = { _id }
	return await validations.findOne(query, { projection });
}

export async function getValidations(populate: boolean = true): Promise<SavedValidation[] | null> {
	const projection = populate ? validationDepopFilter : undefined;
	return new Promise(async (resolve, reject) => {		
		try {
			const cursor : mg.FindCursor = validations.find({}, { projection });
			let documents = []
			for await (const doc of cursor) {
				documents.push(doc);
			}
			resolve(documents)
		}	catch (e) {
			console.error(e)
			resolve(null)
		}
	})
}

export async function deleteAll() {
	await validations.deleteMany();
	console.log("deleted all validations");
}