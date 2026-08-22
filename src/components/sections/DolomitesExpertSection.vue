<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AnimatedText from '@/components/AnimatedText.vue'

type LocationItem = {
  id: number
  text: string
}

const { t, tm } = useI18n()

const locations = computed(() => tm('home.dolomitesExpert.locations') as LocationItem[])
</script>

<template>
  <section
    id="dolomites-expert"
    class="dolomites-expert"
    aria-labelledby="dolomites-expert-title"
  >
    <div class="dolomites-expert__inner">
      <div
        class="dolomites-expert__portrait-side"
        data-aos="block-slide-right"
        data-aos-duration="1000"
        data-aos-offset="140"
      >
        <h2 id="dolomites-expert-title" class="dolomites-expert__title">
          <AnimatedText :text="t('home.dolomitesExpert.title')" tag="span" />
        </h2>

        <figure class="dolomites-expert__quote">
          <blockquote>
            <AnimatedText :text="t('home.dolomitesExpert.quote')" tag="span" />
          </blockquote>
          <figcaption>
            <AnimatedText :text="t('home.dolomitesExpert.author')" tag="span" />
          </figcaption>
        </figure>

        <img
          class="dolomites-expert__photo"
          src="/my-foto2.png"
          :alt="t('home.dolomitesExpert.photoAlt')"
          loading="lazy"
        />
      </div>

      <div
        class="dolomites-expert__copy-side"
        data-aos="block-slide-left"
        data-aos-duration="1000"
        data-aos-offset="140"
      >
        <div
          class="dolomites-expert__copy"
          data-aos="block-slide-left"
          data-aos-duration="900"
          data-aos-offset="100"
        >
          <h3>
            <AnimatedText :text="t('home.dolomitesExpert.stayTitle')" tag="span" />
          </h3>
          <p>
            <AnimatedText :text="t('home.dolomitesExpert.stayText')" tag="span" />
          </p>
        </div>

        <div
          class="dolomites-expert__copy"
          data-aos="block-slide-left"
          data-aos-duration="900"
          data-aos-offset="100"
        >
          <h3>
            <AnimatedText :text="t('home.dolomitesExpert.yearRoundTitle')" tag="span" />
          </h3>
          <p>
            <AnimatedText :text="t('home.dolomitesExpert.yearRoundText')" tag="span" />
          </p>
        </div>

        <div
          class="dolomites-expert__copy"
          data-aos="block-slide-left"
          data-aos-duration="900"
          data-aos-offset="100"
        >
          <h3>
            <AnimatedText :text="t('home.dolomitesExpert.locationsTitle')" tag="span" />
          </h3>
          <ul class="dolomites-expert__locations">
            <li v-for="location in locations" :key="location.id">
              <AnimatedText :text="location.text" tag="span" />
            </li>
          </ul>
        </div>

        <div
          class="dolomites-expert__footer"
          data-aos="block-slide-left"
          data-aos-duration="900"
          data-aos-offset="100"
        >
          <p>
            <AnimatedText :text="t('home.dolomitesExpert.help')" tag="span" />
          </p>
          <q-btn
            unelevated
            no-caps
            class="dolomites-expert__button"
            href="https://wa.me/393341822113"
          >
            <AnimatedText :text="t('home.dolomitesExpert.cta')" tag="span" />
          </q-btn>
        </div>
      </div>
    </div>
  </section>
</template>
