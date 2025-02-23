<template>
    <div class="flex gap-2 items-center">
        <Button variant="default" :disabled="props.databaseId === undefined" class="h-6" @click.prevent
            @mousedown="openBrowserTab(`${BASE_URL === '/' ? '' : BASE_URL + '/'}validations/${props.databaseId}`)">
            <ShowValidation width="20px" height="20px" />
        </Button>
        <Button variant="default" :disabled="props.databaseId === undefined"class="h-6" @click.prevent
            @mousedown="openBrowserDownload(`${PUBLIC_API_URL}/validations/${props.databaseId}`, `${props.databaseId}.json`)">
            <Download height="18px" />
        </Button>
        <!-- <Checkbox :checked="false" @update.checked="$emit('update:checked', $event)" class="w-6 h-6 bg-secondary" id="selected"></Checkbox> -->
    </div>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import ShowValidation from '@/components/ui/ShowValidation.vue'
import Download from "@/components/ui/DownloadIcon.vue"
import { openBrowserDownload } from '@/lib/utils'

const { BASE_URL, PUBLIC_API_URL } = import.meta.env;
console.log(BASE_URL)
const props = defineProps<{
    databaseId: string | undefined,
    status: string
}>()

const openBrowserTab = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.click();
}
</script>