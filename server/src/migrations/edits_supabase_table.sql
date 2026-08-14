
---------------------------------------------------
  -- edits
------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.validate_chunk_workspace()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  expected_workspace_id uuid;
BEGIN
  /*
    Look up the workspace_id that belongs to this chunk's document.
    If it does not match the workspace_id being inserted on the chunk,
    raise an exception and reject the row entirely.
  */
  SELECT workspace_id
  INTO expected_workspace_id
  FROM public.documents
  WHERE id = NEW.document_id;

  IF expected_workspace_id IS NULL THEN
    RAISE EXCEPTION
      'document_id % does not exist', NEW.document_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF expected_workspace_id != NEW.workspace_id THEN
    RAISE EXCEPTION
      'workspace_id % on chunk does not match workspace_id % on document %',
      NEW.workspace_id, expected_workspace_id, NEW.document_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER document_chunks_workspace_check
  BEFORE INSERT OR UPDATE ON public.document_chunks
  FOR EACH ROW EXECUTE FUNCTION public.validate_chunk_workspace();

  -- create Supabase Realtime for documnts tabl
  ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;