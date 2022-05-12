import { createRouter, createWebHistory } from "vue-router";
import IndexView from "../views/IndexView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: (to) => ({
        path: "/index",
      }),
    },
    {
      path: "/index",
      name: "home",
      component: IndexView,
    },
    {
      path: "/info",
      name: "info",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
      props: true,
    },
    {
      path: "/tuto",
      name: "tutorial",
      component: () => import("../views/Tutorial.vue"),
    },
  ],
});

export default router;
