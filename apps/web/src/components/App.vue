<script setup lang="ts">
import Input from '@/components/ui/Input.vue';
import Validations from '@/components/ui/Validations.vue';
import Logo from "@/components/ui/Logo.vue";
</script>

<template>
    <div class="w-full h-full p-2 flex">
        <div class="w-[512px]">
            <header class="flex pl-6 pt-6">
                <Logo></Logo>
                <h1 class="ml-3 text-3xl">Checker</h1>
            </header>
            <div class="px-6 pt-8">
                Check the validity of an RDF statement according to an online resource using a large language model.
            </div>
            <Input class="w-full" />
        </div>
        <div class="w-full">
            <Validations />
        </div>
    </div>
</template>