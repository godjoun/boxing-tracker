export function getRounds(log) {
  const value =
    log?.rounds ||
    log?.round ||
    log?.totalRounds ||
    log?.completedRounds ||
    log?.sets ||
    0;

  return Number(value) || 0;
}

export function getTotalMinutes(log) {
  return Number(log?.minutes || log?.duration || 0);
}

export function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

export function getTrainingStreak(logs) {
  const dateSet = new Set(
    logs
      .map((log) => log?.date)
      .filter(Boolean)
  );

  if (dateSet.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const date = String(cursor.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${date}`;

    if (!dateSet.has(key)) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function isIOSLikeDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getDisplayComment(log) {
  return log?.publicComment || log?.memo || "";
}

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const originalImageData = reader.result;
      const image = new Image();

      image.onload = () => {
        try {
          const maxSize = 700;
          const scale = Math.min(
            maxSize / image.width,
            maxSize / image.height,
            1
          );

          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(originalImageData);
            return;
          }

          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          const compressedImage = canvas.toDataURL("image/jpeg", 0.72);
          resolve(compressedImage);
        } catch {
          resolve(originalImageData);
        }
      };

      image.onerror = () => {
        resolve(originalImageData);
      };

      image.src = originalImageData;
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽지 못했어요."));
    };

    reader.readAsDataURL(file);
  });
}
