import { useCallback, useState } from "react"
import {
  ConversationProvider,
  useConversationControls,
  useConversationStatus,
} from "@elevenlabs/react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2Icon, PhoneIcon, PhoneOffIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"

const env = import.meta.env

// Every VITE_DV_<NAME> in .env is sent to the agent as the {{<name>}} dynamic variable.
const DYNAMIC_VARIABLES: Record<string, string> = Object.fromEntries(
  Object.entries(env)
    .filter(([key]) => key.startsWith("VITE_DV_"))
    .map(([key, value]) => [key.slice("VITE_DV_".length).toLowerCase(), String(value)])
)

const DEFAULT_AGENT = {
  agentId: env.VITE_AGENT_ID as string,
  name: (env.VITE_DV_FIRM_NAME as string) || "Customer Support",
  description: "Tap to start voice chat",
}

export default function Page() {
  const [serverError, setServerError] = useState<string | null>(null)

  return (
    <ConversationProvider
      onError={(message: string, context?: unknown) => {
        console.error("[ElevenLabs] error:", message, context)
        setServerError(message || "Something went wrong. See the browser console.")
      }}
      onConnect={() => setServerError(null)}
    >
      <main className="bg-background text-foreground flex min-h-svh items-center justify-center p-4">
        <div className="w-full max-w-md">
          <VoiceChat02 serverError={serverError} />
        </div>
      </main>
    </ConversationProvider>
  )
}

export function VoiceChat02({ serverError }: { serverError?: string | null }) {
  const { status } = useConversationStatus()
  const { startSession, endSession, getInputVolume, getOutputVolume } =
    useConversationControls()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const startConversation = useCallback(async () => {
    try {
      setErrorMessage(null)
      await navigator.mediaDevices.getUserMedia({ audio: true })
      startSession({
        agentId: DEFAULT_AGENT.agentId,
        connectionType: "webrtc",
        dynamicVariables: DYNAMIC_VARIABLES,
      })
    } catch (error) {
      console.error("Error starting conversation:", error)
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setErrorMessage("Please enable microphone permissions in your browser.")
      } else {
        setErrorMessage(error instanceof Error ? error.message : String(error))
      }
    }
  }, [startSession])

  const handleCall = useCallback(() => {
    if (status === "disconnected" || status === "error") {
      startConversation()
    } else if (status === "connected") {
      endSession()
    }
  }, [status, endSession, startConversation])

  const isCallActive = status === "connected"
  const isTransitioning = status === "connecting"
  const shownError = errorMessage ?? (status === "error" ? serverError : null)

  const scaledInputVolume = useCallback(() => {
    try {
      const rawValue = getInputVolume() ?? 0
      return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5)
    } catch {
      return 0
    }
  }, [getInputVolume])

  const scaledOutputVolume = useCallback(() => {
    try {
      const rawValue = getOutputVolume() ?? 0
      return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5)
    } catch {
      return 0
    }
  }, [getOutputVolume])

  return (
    <Card className="flex h-[400px] w-full flex-col items-center justify-center overflow-hidden p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="relative size-32">
          <div className="bg-muted relative h-full w-full rounded-full p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
              <Orb
                className="h-full w-full"
                volumeMode="manual"
                getInputVolume={scaledInputVolume}
                getOutputVolume={scaledOutputVolume}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">{DEFAULT_AGENT.name}</h2>
          <AnimatePresence mode="wait">
            {shownError ? (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-destructive max-w-xs text-center text-sm"
              >
                {shownError}
              </motion.p>
            ) : status === "disconnected" || status === "error" ? (
              <motion.p
                key="disconnected"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-muted-foreground text-sm"
              >
                {DEFAULT_AGENT.description}
              </motion.p>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2"
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    status === "connected" && "bg-green-500",
                    isTransitioning && "bg-primary/60 animate-pulse"
                  )}
                />
                <span className="text-sm capitalize">
                  {isTransitioning ? (
                    <ShimmeringText text={status} />
                  ) : (
                    <span className="text-green-600">Connected</span>
                  )}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          onClick={handleCall}
          disabled={isTransitioning}
          size="icon"
          variant={isCallActive ? "secondary" : "default"}
          className="h-12 w-12 rounded-full"
        >
          <AnimatePresence mode="wait">
            {isTransitioning ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                }}
              >
                <Loader2Icon className="h-5 w-5" />
              </motion.div>
            ) : isCallActive ? (
              <motion.div
                key="end"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <PhoneOffIcon className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <PhoneIcon className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </Card>
  )
}
