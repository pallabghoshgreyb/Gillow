import { Patent, TechNode } from '../types';

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeCsv = (value: string | number | null | undefined) => {
  const normalized = value === null || value === undefined ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

export const exportPatentsToCsv = (patents: Patent[], filename: string) => {
  const headers = [
    'Publication Number',
    'Title',
    'Assignee',
    'Domain',
    'Subdomain',
    'Patent Type',
    'Legal Status',
    'Jurisdiction',
    'Filing Date',
    'Publication Date',
  ];

  const rows = patents.map((patent) => [
    patent.publicationNumber,
    patent.title,
    patent.assignee.name,
    patent.domain,
    patent.subdomain || 'General',
    patent.patentType,
    patent.legalStatus,
    patent.jurisdiction,
    patent.filingDate,
    patent.publicationDate,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
};

export const exportPatentToCsv = (patent: Patent, filename: string) => {
  exportPatentsToCsv([patent], filename);
};

export const exportTechLandscapeReport = (tech: TechNode, patents: Patent[], filename: string) => {
  const headers = [
    'Technology ID',
    'Technology Name',
    'Technology Level',
    'Technology Domain',
    'Technology Subdomain',
    'Publication Number',
    'Title',
    'Assignee',
    'Patent Domain',
    'Patent Subdomain',
    'Patent Type',
    'Legal Status',
    'Jurisdiction',
    'Filing Date',
    'Publication Date',
  ];

  const rows = patents.map((patent) => [
    tech.id,
    tech.name,
    tech.level,
    tech.domain,
    tech.subdomain || '',
    patent.publicationNumber,
    patent.title,
    patent.assignee.name,
    patent.domain,
    patent.subdomain || 'General',
    patent.patentType,
    patent.legalStatus,
    patent.jurisdiction,
    patent.filingDate,
    patent.publicationDate,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
};
