const THUMBNAIL_FILENAMES: Record<string, string> = {
  "aidiagnosticdecisiontrees": "AI Diagnostic Decision Trees.png",
  "airealtimedrillingparameteroptimizers": "AI Real-Time Drilling Parameter Optimizers.png",
  "aesencryptionhardwareaccelerator": "AES Encryption Hardware Accelerator.png",
  "capacitivememsaccelerometer": "Capacitive MEMS Accelerometer.png",
  "roboticcontrolsystems": "Robotic Control Systems.png",
  "roboticstructuralcomponents": "Robotic Structural Components.png",
  "softgrippersuctioncups": "Soft Gripper Suction Cups.png",
  "titaniumimplants": "Titanium Implants.png",
  "bloodpressuremonitors": "Blood Pressure Monitors.png",
  "trackinglocalization": "Tracking & Localization.png",
  "telemedicineprescriptionapps": "Telemedicine Prescription Apps.png",
  "roboticsupportsystems": "Robotic Support Systems.png",
  "roboticsurgicalsystems": "Robotic Surgical Systems.png",
  "surgicalvisualization": "Surgical visualization.png",
  "surgicalendeffectors": "Surgical End Effectors.png",
  "anatomicaltorsoorganmodels": "Anatomical Torso Organ ModelS.png",
};

const normalizeKey = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export const getPatentThumbnailSrc = (subdomain?: string | null) => {
  const key = normalizeKey(subdomain);
  const filename = THUMBNAIL_FILENAMES[key];

  if (!filename) {
    return "/patent-card-thumb.png";
  }

  return `/patent-thumbs/${encodeURIComponent(filename)}`;
};
