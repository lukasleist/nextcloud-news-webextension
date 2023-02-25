<template>
    <div v-if="unreadCount" class="unread-header-wrapper">
        <span class="unread-count-heading">
            <h3>
                {{ "unreadArticlesHeading" | i18n }}
            </h3>
            <NcCounterBubble type="highlighted">{{ unreadCount }}</NcCounterBubble>
        </span>
        <span class="controls">
            <button class="button reload-button" :title="'reloadTitle' | i18n" @click="reload"></button>
            <button class="button read-button" :title="'markAllAsReadTitle' | i18n" @click="markAllAsRead"></button>
            <a target="_blank" :href="url + '/index.php/apps/news/'">
                <button class="button open-app-button" :title="'openNextcloudNews' | i18n"></button></a>

        </span>
    </div>
</template>
<script lang="ts">
import NcCounterBubble from '@nextcloud/vue/dist/Components/NcCounterBubble'

export default {
    components: {
        NcCounterBubble
    },
    props: {
        unreadCount: Number,
        url:String
    },
    methods: {
        reload(event: any) {
            this.$emit("reload");
        },
        markAllAsRead(event: any) {
            this.$emit("markAllAsRead");
        }
    }
}
</script>
<style scoped>
.unread-header-wrapper {
    display: flex;
    justify-content: space-between;
    padding-bottom: 0.3em;
    margin-bottom: 0.4em;
    border-bottom-color: var(--color-box-shadow);
    border-bottom-style: solid;
    border-bottom-width: 3px;
}

.unread-count-heading {
    display: flex;
}

h3 {
    font-weight: normal;
    margin: 0 0.5em 0 0;
}

.reload-button {
    background-image: var(--icon-history-000);
}

.open-app-button {
    background-image: var(--icon-external-000);
}
</style>