import { GlobalRegistrator } from "@happy-dom/global-registrator"

GlobalRegistrator.register()

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = false
