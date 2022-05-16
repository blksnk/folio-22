<template>
<div class="table">
  <div class="table__header">
    <span v-for="(header, index) in headers" :key="index">{{header}}</span>
    <div v-for="(row, index) in rows" :class="{
      table__row: true,
      reversed
    }">
    <a href=""></a>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

type TableRowValue = string | number;
type TableRowItem = {
  value: TableRowValue,
  url?: string,
} | TableRowValue

type TableRow = TableRowItem[]

interface TableProps {
  reversed?: boolean;
  headers: string[]
  rows: TableRow[]
}

defineProps<TableProps>()
</script>