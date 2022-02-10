import { defineStore } from "pinia";

export const useApiData = defineStore("apiData", {
  state: () => ({
    projects: [
      {
        title: "init proj",
        uid: 0,
        type: "test proj",
        thumbnail: {
          large: {
            height: 800,
            width: 400,
            path: null,
            aspectRation: 0.5,
            url: "https://images.unsplash.com/photo-1643293383951-0755fda59471?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80",
          },
        },
      },
    ],
  }),
});
