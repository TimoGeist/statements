# Statements Validation System
Evaluate the truthfulness of a given statement in the form of **subject, predicate, object**, according to an internet resource at a given **url**, for example an article. The statement and textual content of the resource is passed to a selected LLM for evaluation.

![Statement example (
RDF Triple), Source: Lincs Portal](https://lincsproject.ca/assets/images/linked-data-triple-%28c-LINCS%29-2c18c881c5f566b0c5a6aa4b4812adc9.jpg)


## Installation

### Prerequisites:
-  **Ollama endpoint** in the cloud **OR** a reasonably powerful local GPU, recommended at least 8GB VRAM to load a quantized Llama 3.1 8B Instruct through Ollama (https://ollama.com/download).
-	**Python 3**, tested on **3.12.3** ([python.org/downloads](https://www.python.org/downloads/)).
-	**NodeJS**, version **22.14.0 LTS** ([nodejs.org/en/download](https://nodejs.org/en/download)).
-	**Linux**, if you want to run premade build scripts contained in package.json files.
-	**MongoDB** and **Redis** instance, simpliest way to run them is with Docker ([docs.docker.com/engine/install](https://docs.docker.com/engine/install)).

### Steps:
1. Clone or download this repository.
`git clone https://github.com/TimoGeist/statements`

2. Run MongoDB and Redis in a container.
`docker run --name some-mongo -d -p 27017:27017 mongo`,
`docker run --name some-redis -d -p 6379:6379`

3. Set **environment variables** in `statements/apps/api/.env`
`MONGODB_URI=mongodb://localhost:27017`
`REDIS_URL=http://localhost:6379`
`OLLAMA_URL=https://example.com/ollama`
`PYTHON_COMMAND=../core/venv/bin/python3`

4. Run scripts
`npm install`
`turbo install`
`turbo build`
`turbo start`

The web application will be available at http://localhost:9001,
the API at http://localhost:9000

### This monorepo contains: 
- **HTTP API**, responsible for  core logic and interaction with the request queue, database and LLM `statements/apps/api/`
- **Web UI** as an interactive client to work with the API. `statements/apps/web`
- Shared libraries folder containing shared libraries and Typescript types. `statements/packages`
