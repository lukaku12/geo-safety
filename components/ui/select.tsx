"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

/** Pause between keystrokes after which the type-ahead buffer starts over. */
const TYPEAHEAD_RESET_MS = 700;

/**
 * Custom select following the WAI-ARIA "select-only combobox" pattern: the
 * trigger keeps focus and steers the listbox via `aria-activedescendant`;
 * arrows/Home/End move, Enter/Space commit, Escape and outside-click dismiss,
 * and typing jumps to the first matching option.
 *
 * `closeOnSelect={false}` is for pure view-filter pickers (e.g. the billing
 * period): picking applies live but keeps the list open so several options can
 * be tried in one session; only Escape/outside-click/the trigger dismiss it.
 */
export function Select({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Select…",
  disabled = false,
  closeOnSelect = true,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const optionId = (index: number) => `${uid}-option-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ buffer: "", lastKeyAt: 0 });
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    setOpenUp(false);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    if (closeOnSelect) closeList();
    else setActiveIndex(index);
  };

  // Flip above the trigger when the viewport has no room below (before paint,
  // so the list never flashes in the wrong place — e.g. the pagination bar).
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = rootRef.current?.getBoundingClientRect();
    const height = listRef.current?.getBoundingClientRect().height;
    if (!trigger || !height) return;
    setOpenUp(
      trigger.bottom + height + 8 > window.innerHeight &&
        trigger.top - height - 8 > 0,
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeList();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active option visible while arrowing through a scrolled list.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(`${uid}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, uid]);

  const moveActive = (next: (current: number) => number) =>
    setActiveIndex((current) =>
      Math.min(options.length - 1, Math.max(0, next(current))),
    );

  const searchOptions = (key: string) => {
    const state = typeahead.current;
    const now = Date.now();
    state.buffer =
      now - state.lastKeyAt > TYPEAHEAD_RESET_MS ? key : state.buffer + key;
    state.lastKeyAt = now;

    const term = state.buffer.toLowerCase();
    // A fresh buffer searches *past* the active option so repeating a letter
    // cycles through everything starting with it.
    const from = state.buffer.length === 1 ? activeIndex + 1 : activeIndex;
    for (let step = 0; step < options.length; step += 1) {
      const index = (Math.max(from, 0) + step) % options.length;
      if (options[index].label.toLowerCase().startsWith(term)) {
        setActiveIndex(index);
        return;
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Tab") {
      closeList();
      return;
    }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      // Enter/Space activate the button → onClick toggles the list open.
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeList();
        break;
      case "ArrowDown":
        e.preventDefault();
        moveActive((i) => i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive((i) => i - 1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          searchOptions(e.key);
        }
    }
  };

  return (
    <div ref={rootRef} className={cn("relative h-10 w-fit", className)}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onKeyDown}
        className="flex h-full w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          // Pointer leaving the list rests the highlight back on the selected
          // option (like native menus) instead of leaving it wherever the
          // mouse last was.
          onMouseLeave={() => setActiveIndex(selectedIndex)}
          // `w-max` sizes the list to its widest option (a narrow trigger no
          // longer forces labels to wrap); the max-width cap keeps very long
          // labels wrapping instead of running off small screens.
          className={cn(
            "absolute left-0 z-50 max-h-60 w-max min-w-full max-w-[min(90vw,28rem)] overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg",
            openUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              // Keep focus on the trigger so the combobox keeps receiving keys.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => commit(index)}
              className={cn(
                "scroll-my-1 cursor-pointer rounded px-2.5 py-1.5 text-sm",
                index === activeIndex && "bg-primary/10",
                option.value === value && "font-semibold text-primary",
              )}
            >
              {option.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
