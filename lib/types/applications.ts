export type ApplicationHistoryItem = {
  apply_sn: number;
  qustnr_sn: number | null;
  category: string;
  title: string;
  target_url: string | null;
  author: string;
  session_date_text: string;
  applied_at_text: string;
  application_status: string;
  approval_status: string;
};

export type ApplicationsResponse = {
  items: ApplicationHistoryItem[];
  cached_at: string;
  refreshed: boolean;
};
