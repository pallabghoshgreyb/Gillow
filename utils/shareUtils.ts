export interface ShareContentOptions {
  title: string;
  text?: string;
  url?: string;
}

export type ShareResult = 'shared' | 'copied';

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', 'true');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

export const shareContent = async ({ title, text, url }: ShareContentOptions): Promise<ShareResult> => {
  const shareUrl = url ?? window.location.href;
  const payload = {
    title,
    text,
    url: shareUrl,
  };

  if (navigator.share) {
    await navigator.share(payload);
    return 'shared';
  }

  await copyToClipboard(shareUrl);
  return 'copied';
};
