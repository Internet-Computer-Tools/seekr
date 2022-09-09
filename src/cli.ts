#!/usr/bin/env node

import { Seekr } from './seekr'

;(async () => {
  await new Seekr().run()
})()
