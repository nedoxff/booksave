import { SourceOption } from "$lib/api/types/internal/ExportOptions";
import { createArchiveForSource } from "$lib/archive";
import { onMessage } from "$lib/messaging";

onMessage("beginExportFromOffscreenPage", async (msg) => {
  console.log(`[mv3] beginning export for ${SourceOption[msg.data.source]}`);
  return await createArchiveForSource(
    msg.data.request,
    msg.data.authorization,
    msg.data.source,
  );
});

console.log("[mv3] offscreen page has been created and initialized");
