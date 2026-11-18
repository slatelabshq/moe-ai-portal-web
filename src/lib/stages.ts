const STAGE_LABELS = [
  'Lead',
  'Contacted',
  'Consultation booked',
  'Consultation done',
  'Proposal sent',
  'Proposal viewed',
  'Shortlist agreed',
  'Documents requested',
  'Documents received',
  'Application submitted',
  'Admissions',
  'Approved',
  'Qualified',
  'Offer received',
  'Enrolled',
];

export function stageLabel(stage: number): string {
  return STAGE_LABELS[Math.max(0, Math.min(stage, STAGE_LABELS.length - 1))];
}
