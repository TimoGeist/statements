<template>
	<form @submit="onSubmit" class="flex flex-col gap-y-3 p-5">
	
		<div class="space-y-[3px] flex flex-col">
			<div class="ml-2 text-sm">
			Load Examples
			</div>
			<div class="flex items-start gap-x-4">
				<Button @click="loadExample('Fluorescence')" type="button" variant="outline" class="leading-3  px-3">
					Fluorescence&nbsp;
				</Button>
				<Button @click="loadExample('Ports')" type="button" variant="outline" class="leading-3 px-3">
					Ports&nbsp;
				</Button>
				<Button @click="loadExample('History')" type="button" variant="outline" class="leading-3 px-3">
					History&nbsp;
				</Button>
			</div>
		</div>
		
		<FormField v-slot="{ componentField }" name="subject">
			<FormItem class="space-y-[3px]">
				<FormLabel class="ml-2">Subject</FormLabel>
				<FormControl>
					<Input type="text" placeholder="Bioluminescence" v-bind="componentField" />
				</FormControl>
			</FormItem>
		</FormField>

		<FormField v-slot="{ componentField }" name="predicate">
			<FormItem class="space-y-[3px]">
				<FormLabel class="ml-2">Predicate</FormLabel>
				<FormControl>
					<Input type="text" placeholder="different from" v-bind="componentField" />
				</FormControl>
			</FormItem>
		</FormField>

		<FormField v-slot="{ componentField }" name="object">
			<FormItem class="space-y-[3px]">
				<FormLabel class="ml-2">Object</FormLabel>
				<FormControl>
					<Input type="text" placeholder="Biofluorescence" v-bind="componentField" />
				</FormControl>
			</FormItem>
		</FormField>

		<FormField v-slot="{ componentField }" name="url">
			<FormItem class="space-y-[3px]">
				<FormLabel class="ml-2 flex">Validation Website URL
					<HoverCard :openDelay="100" :closeDelay="0">
						<HoverCardTrigger as-child class="flex items-start justify-start mb-1">
							<Info class="ml-2" :size="14"></Info>
						</HoverCardTrigger>
						<HoverCardContent class="w-64" side="left">
							The statement will be validated according to the information found on this specific website.
						</HoverCardContent>
					</HoverCard>
				</FormLabel>
				<FormControl>
					<Input class="w-full pl-3" type="text" placeholder="https://en.wikipedia.org/wiki/Fluorescence"
						v-bind="componentField" />
				</FormControl>
			</FormItem>
		</FormField>

		<FormField v-slot="{ componentField }" name="modelInfo">
			<FormItem class="space-y-[3px]">
				<FormLabel class="ml-2">
					Large Language Model
				</FormLabel>
				<Select v-bind="componentField">
					<FormControl class="space-y-0">
						<SelectTrigger>
							<SelectValue :default="{ defaultModelInfo }" class="w-full pl-0 text-left" placeholder="Pick a model" />
						</SelectTrigger>
					</FormControl>
					<SelectContent class="w-full">
						<SelectGroup v-for="(shownModel, idx) in uniqBy(models, 'provider')" :key="shownModel.provider">
							<SelectLabel class="pl-8 w-full">{{ shownModel.provider }}</SelectLabel>
							<SelectItem class="text-center w-full"
								v-for="shownModel in models.filter(m => m.provider === shownModel.provider)"
								:key="`${shownModel.id}@${shownModel.provider}`"
								:value="`${shownModel.id}@${shownModel.provider}`">
								{{ shownModel.name }}
							</SelectItem>
							<SelectSeparator v-if="idx !== Object.keys(models).length - 1">
							</SelectSeparator>
						</SelectGroup>
					</SelectContent>
				</Select>
			</FormItem>
		</FormField>


		<!-- <FormField v-slot="{ componentField }" name="temperature">
			<FormItem class="space-y-[3px] h-10 pt-[6px] flex flex-col justify-between">
				<FormLabel class="pl-2 pr-2 flex justify-between">
					<span>Temperature</span>
					<span>{{ componentField.modelValue[0].toFixed(2) }}</span>
				</FormLabel>
				<FormControl>
					<Slider class="px-1" :default="[0.1]" :min="0" :max="1" :step="0.01" v-bind="componentField" />
				</FormControl>
			</FormItem>
		</FormField> -->

		<Button type="submit" class="w-full mt-8 font-bold text-lg leading-3" variant="default">
			Validate
		</Button>
	</form>
</template>

<script setup lang="ts">
import StatusIcon from "@/components/ui/StatusIcon.vue"
import { enqueue, API_URL, models } from "@/components/state"
import * as st from "@repo/types"
// import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	SelectSeparator
} from '@/components/ui/select'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { useForm } from 'vee-validate'
import { uniqBy } from "lodash"
import { Info, SpaceIcon } from "lucide-vue-next"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card"
// import { computed } from "vue"

const examples = {
	Fluorescence: {
		subject: "Bioluminescence",
		predicate: "different from",
		object: "Biofluorescence",
		url: "https://en.wikipedia.org/wiki/Fluorescence"
	},
	Ports: {
		subject: "https://example.com",
		predicate: "runs on",
		object: "port 80",
		url: "https://www.w3.org/TR/2011/WD-html5-20110525/urls.html"

	},
	History: {
		subject: "Václav Havel",
		predicate: "is",
		object: "playwright",
		url: "https://www.prg.aero/en#/"
	}
}


function loadExample(example: string) {
	form.setValues(examples[example]);
}

//TODO
const defaultModelInfo = "deepseek-r1:70b@ollama"

const formSchema = toTypedSchema(z.object({
	subject: z.string().min(1).transform(v => v.trim()),
	predicate: z.string().min(1).transform(v => v.trim()),
	object: z.string().min(1).transform(v => v.trim()),
	url: z.string().url().transform(v => v.trim()),
	// temperature: z.array(z.number(").min(0).max(1).step(0.01)),
	modelInfo: z.string().default(defaultModelInfo)
}));

const form = useForm({
	validationSchema: formSchema,
	initialValues: {
		modelInfo: defaultModelInfo,
	}
})



const onSubmit = form.handleSubmit((values) => {
	const splitModelInfo = values.modelInfo.split("@");
	console.log(splitModelInfo)
	const vr: st.ValidationRequest = {
		statement: {
			subject: values.subject,
			predicate: values.predicate,
			object: values.object,
		},
		modelOptions: {
			// temperature: values.temperature[0],
			id: splitModelInfo[0],
			provider: splitModelInfo[1],
		},
		resourceURL: values.url
	}
	console.log("enqueing", vr)
	enqueue(vr)
})


</script>
