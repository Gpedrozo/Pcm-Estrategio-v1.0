-- Auditoria obrigatória para toda operação de INSERT/UPDATE/DELETE nas tabelas públicas
-- Mantém os logs manuais existentes (ex.: LOGIN/LOGOUT) e adiciona cobertura universal de CRUD

CREATE OR REPLACE FUNCTION public.registrar_auditoria_automatica()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id UUID := auth.uid();
  actor_nome TEXT;
  actor_empresa_id UUID;
  row_empresa_id UUID;
  row_id TEXT;
  acao_texto TEXT;
BEGIN
  IF TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME = 'auditoria' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF actor_id IS NOT NULL THEN
    SELECT p.nome, p.empresa_id
      INTO actor_nome, actor_empresa_id
      FROM public.profiles p
      WHERE p.id = actor_id
      LIMIT 1;
  END IF;

  actor_nome := COALESCE(actor_nome, 'Sistema');

  IF TG_OP = 'INSERT' THEN
    row_empresa_id := NULLIF(to_jsonb(NEW)->>'empresa_id', '')::UUID;
    row_id := COALESCE(to_jsonb(NEW)->>'id', 'sem-id');
    acao_texto := 'INCLUIDO';
  ELSIF TG_OP = 'UPDATE' THEN
    row_empresa_id := COALESCE(
      NULLIF(to_jsonb(NEW)->>'empresa_id', '')::UUID,
      NULLIF(to_jsonb(OLD)->>'empresa_id', '')::UUID
    );
    row_id := COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id', 'sem-id');
    acao_texto := 'ALTERADO';
  ELSE
    row_empresa_id := NULLIF(to_jsonb(OLD)->>'empresa_id', '')::UUID;
    row_id := COALESCE(to_jsonb(OLD)->>'id', 'sem-id');
    acao_texto := 'EXCLUIDO';
  END IF;

  row_empresa_id := COALESCE(row_empresa_id, actor_empresa_id);

  INSERT INTO public.auditoria (
    usuario_id,
    usuario_nome,
    acao,
    descricao,
    tag,
    empresa_id
  ) VALUES (
    actor_id,
    actor_nome,
    acao_texto,
    format('%s em %s (id=%s)', acao_texto, TG_TABLE_NAME, row_id),
    format('AUTO_%s_%s', TG_OP, TG_TABLE_NAME),
    row_empresa_id
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT t.tablename
      FROM pg_tables t
      WHERE t.schemaname = 'public'
        AND t.tablename NOT IN ('auditoria')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_auditoria_auto ON public.%I;', rec.tablename);

    EXECUTE format(
      'CREATE TRIGGER trg_auditoria_auto AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica();',
      rec.tablename
    );
  END LOOP;
END;
$$;