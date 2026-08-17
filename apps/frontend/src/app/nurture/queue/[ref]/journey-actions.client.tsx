"use client";

import { useState } from "react";
import { ActionButton } from "@willyu1007/web-workbench";
import { ConsequenceConfirm, type ConfirmTarget } from "@/components/consequence-confirm";
import { DISCLOSURES, FULLSCREEN_ACTIONS } from "@/lib/view/consequences";

/**
 * The record's action row. Every action goes through the same confirmation
 * surface; the destructive ones simply get the full-screen frame, which the
 * component looks up rather than the caller choosing.
 */
export function JourneyActions({
  actionKeys,
  target,
}: {
  readonly actionKeys: readonly string[];
  readonly target: ConfirmTarget;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const available = actionKeys.filter((key) => key in DISCLOSURES);
  if (available.length === 0) return null;

  return (
    <>
      {available.map((key, index) => {
        const disclosure = DISCLOSURES[key];
        if (disclosure === undefined) return null;
        return (
          <ActionButton
            key={key}
            // One primary per scene: the first offered action leads, the rest
            // are ghosts, and an irreversible one never wears the primary pill.
            kind={index === 0 && !FULLSCREEN_ACTIONS.has(key) ? "primary" : "ghost"}
            onClick={() => setOpenKey(key)}
          >
            {disclosure.title}
          </ActionButton>
        );
      })}
      <ConsequenceConfirm
        disclosure={openKey === null ? null : (DISCLOSURES[openKey] ?? null)}
        target={target}
        open={openKey !== null}
        onClose={() => setOpenKey(null)}
      />
    </>
  );
}
