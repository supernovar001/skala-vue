<script setup>
defineProps({
  isFavorite: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <button class="btn-favorite" @click.stop="emit('toggle')">
    {{ isFavorite ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기' }}
  </button>
</template>

<style scoped>
.btn-favorite {
  position: absolute;
  right: 12px;
  top: 50px;
  padding: 6px 10px;
  cursor: pointer;
}
</style>
