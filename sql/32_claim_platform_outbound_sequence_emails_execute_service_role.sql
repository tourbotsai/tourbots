-- 32_claim_platform_outbound_sequence_emails_execute_service_role.sql
-- Restrict execute access for SECURITY DEFINER RPC to trusted backend role only.

REVOKE ALL ON FUNCTION public.claim_platform_outbound_sequence_emails(timestamptz, integer)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_platform_outbound_sequence_emails(timestamptz, integer)
  FROM anon;
REVOKE ALL ON FUNCTION public.claim_platform_outbound_sequence_emails(timestamptz, integer)
  FROM authenticated;

GRANT EXECUTE ON FUNCTION public.claim_platform_outbound_sequence_emails(timestamptz, integer)
  TO service_role;
