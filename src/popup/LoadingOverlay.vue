<template>
    <div class="loading-overlay">
        <NcLoadingIcon :size="24" appearance="dark" title="Loading on light background" />
    </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
//@ts-ignore
import NcLoadingIcon from "@nextcloud/vue/dist/Components/NcLoadingIcon";

export default defineComponent({
    components: {
        NcLoadingIcon
    }
});

</script>
<style>
.loading-overlay {
    background-color: #0000001d;
    position: absolute;
    left: -5px;
    right: -5px;
    top: 0;
    bottom: 0;
    z-index: 2;
}

.loading-overlay span {
    /*height: 100%;*/
    height: min(100vh, 100%);
}

.loading-icon svg {
    animation: rotate 0.8s linear infinite !important;
}
</style>
