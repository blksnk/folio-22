<script lang="ts">
import { RouterView } from "vue-router";
import { useApiData } from "@/stores/apiData";
import { loadApi } from "./utils/api";
import NavBar from "./components/NavBar.vue";
import AppLogo from "./components/icons/AppLogo.vue";

export default {
  components: {
    RouterView,
    NavBar,
    AppLogo,
  },
  setup() {
    // const store = useApiData();

    // setTimeout(() => loadApi(store), 500);

    // return {
    //   store,
    // };
  },
  
};
</script>

<template>
  <RouterView />
  <NavBar />
  <AppLogo />
</template>
