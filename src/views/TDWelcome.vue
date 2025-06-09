<template>
  <div class="container">
    <h1 class="tagline">
      {{ $t("i18nCommon.welcomeTextOne") }}
      <span class="accent">{{ $t("i18nCommon.welcomeTextTwo") }}</span
      ><br />{{ $t("i18nCommon.welcomeTextThree") }}
    </h1>
    <p class="description">{{ $t("i18nCommon.createbyAuthor") }}</p>
  </div>
</template>
<script></script>
<style scoped>
.tagline {
  font-size: 76px;
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: -1.5px;
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
  font-family: var(--vt-font-family-base);
}
body[data-theme="light"] .accent,
body[data-theme="dark"] .tagline {
  background: -webkit-linear-gradient(315deg, #42d392 25%, #647eff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.description {
  max-width: 960px;
  line-height: 1.5;
  color: var(--text-color-light);
  transition: color 0.5s;
  font-size: 22px;
  margin: 24px auto 40px;
}
body[data-theme="dark"] .description {
  color: var(--text-color-dark);
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
