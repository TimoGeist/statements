<script setup>
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"


const props = defineProps(["validation", "prettyModelName", "API_URL"]);
const v = props.validation;

import { openBrowserDownload } from "@/lib/utils"
import Download from "@/components/ui/DownloadIcon.vue"
</script>

<template>
    <div class="w-full max-w-[1024px] mx-auto pt-32 text-center text-lg">
        <div class="text-muted-foreground">The RDF statement&nbsp;</div>
        <div class="mt-2">
            <Badge v-for="part in v.statement"
                class="text-3xl bg-primary py-2 px-6 text-background hover:bg-muted hover:text-black mr-2">
                {{ part }}
            </Badge>
        </div>

        <div class="mt-8 text-muted-foreground">&nbsp;
            {{ v.result.verdict === true ? "has been confirmed to be" :
                v.result.verdict === false ? "has been confirmed to be" :
                    v.result.verdict === null ? "could not be evaluated due to" :
                        null
            }}
        </div>
        <div class="text-8xl">
            {{
                v.result.verdict === true ? "TRUE" :
                    v.result.verdict === false ? "FALSE" :
                        v.result.verdict === null ? "INSUFFICIENT SOURCE CONTEXT" :
                            null
            }}
        </div>

        <div class="mt-4 text-muted-foreground">
            based on the resource at
        </div>
        <Button variant="link" class="block text-2xl mx-auto underline">
            <a :href=v.resourceURL>
                {{ v.resourceURL }}
            </a>
        </Button>

        <div class="mt-8 text-muted-foreground">
            according to the the LLM
        </div>

        <div class="text-2xl">
            {{props.prettyModelName}}
        </div>

        <div class="mt-8 text-muted-foreground">
            which reasons as follows:
        </div>

        <div class="mt-4 text-xl w-[1024px] italic text-justify mx-auto">
            &OpenCurlyDoubleQuote;{{ props.validation.result.explanation }}&CloseCurlyDoubleQuote;
        </div>   

        <Button variant="default" class="text-1xl h-8 pl-4 pr-5 py-6 mx-auto mt-20 flex" @click.prevent
            @mousedown="() => openBrowserDownload(`${API_URL}/validations/${v._id}`, `${v._id}.json`)">
            <Download height="32px" />
            <span class="ml-4">JSON</span>
        </Button>

    </div>
</template>
