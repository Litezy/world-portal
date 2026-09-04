"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ExternalLink, Eye, FileText, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  label: string;
  url: string;
};

export function DocumentViewerModal({ label, url }: Props) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const isPdf = url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf");
  const isImage =
    /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(url) ||
    url.toLowerCase().includes("/image/upload/") ||
    (!isPdf && Boolean(url));

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setIsLoading(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs shrink-0 font-medium hover:border-primary/50">
          <Eye className="size-3.5 text-primary" />
          View Document
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl p-6 sm:max-w-4xl overflow-hidden border-border/80 bg-background/95 backdrop-blur-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4 pr-8">
          <div>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <FileText className="size-4 text-primary" />
              {label}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Verified applicant document attachment
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs font-medium">
              <a href={url} download target="_blank" rel="noreferrer">
                <Download className="size-3.5" />
                Download
              </a>
            </Button>

            <Button asChild size="sm" variant="ghost" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Open External
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* Viewport Frame with Modern Asset Loader */}
        <div className="relative mt-4 flex min-h-[480px] max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/20 backdrop-blur-md">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-lg"
              >
                {/* Laser Scan Line Effect */}
                <motion.div
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8]"
                />

                {/* Animated Spinner & Glass Badge */}
                <div className="relative grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/10">
                  <div className="absolute inset-0 rounded-2xl animate-pulse bg-primary/15" />
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>

                <div className="flex flex-col items-center text-center px-4">
                  <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
                    Loading Asset
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    Fetching high-resolution document preview...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Asset */}
          {isImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: isLoading ? 0 : 1, scale: isLoading ? 0.96 : 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex h-full max-h-[65vh] w-full items-center justify-center p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={label}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-md border border-border/40"
              />
            </motion.div>
          ) : isPdf ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoading ? 0 : 1 }}
              transition={{ duration: 0.4 }}
              className="h-[65vh] w-full"
            >
              <iframe
                src={url}
                title={label}
                onLoad={() => setIsLoading(false)}
                className="h-[65vh] w-full rounded-xl border-0"
              />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                This document format cannot be rendered inline. Click below to download or view the file directly.
              </p>
              <Button asChild size="sm" variant="primary" className="mt-2 gap-2">
                <a href={url} target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  Download File
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
