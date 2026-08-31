


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "inventory";


ALTER SCHEMA "inventory" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "inventory"."confirm_transfer"("p_transfer_id" "uuid", "p_confirmed_by" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_transfer inventory.stock_transfers;
  v_tx_in_id uuid;
BEGIN
  SELECT * INTO v_transfer
  FROM inventory.stock_transfers
  WHERE id = p_transfer_id AND status = 'IN_TRANSIT';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer % not found or not IN_TRANSIT', p_transfer_id;
  END IF;

  -- Create TRANSFER_IN transaction (stock arrives at destination)
  INSERT INTO inventory.stock_transactions
    (variant_id, location_id, type, qty, note, source, transfer_ref, performed_by)
  VALUES
    (v_transfer.variant_id, v_transfer.to_location_id, 'TRANSFER_IN', 
     v_transfer.qty, v_transfer.note, 'MANUAL', p_transfer_id, p_confirmed_by)
  RETURNING id INTO v_tx_in_id;

  -- Close the transfer record
  UPDATE inventory.stock_transfers SET
    status = 'DELIVERED',
    delivered_at = now(),
    confirmed_by = p_confirmed_by,
    transfer_in_tx_id = v_tx_in_id
  WHERE id = p_transfer_id;
END;
$$;


ALTER FUNCTION "inventory"."confirm_transfer"("p_transfer_id" "uuid", "p_confirmed_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."initiate_transfer"("p_variant_id" "uuid", "p_from_location_id" "uuid", "p_to_location_id" "uuid", "p_qty" numeric, "p_note" "text" DEFAULT NULL::"text", "p_performed_by" "uuid" DEFAULT NULL::"uuid", "p_lalamove_ref" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_tx_out_id uuid;
  v_transfer_id uuid;
BEGIN
  -- Create TRANSFER_OUT transaction (stock leaves source immediately)
  INSERT INTO inventory.stock_transactions
    (variant_id, location_id, type, qty, note, source, performed_by)
  VALUES
    (p_variant_id, p_from_location_id, 'TRANSFER_OUT', p_qty, p_note, 'MANUAL', p_performed_by)
  RETURNING id INTO v_tx_out_id;

  -- Create transfer record in IN_TRANSIT status
  INSERT INTO inventory.stock_transfers
    (variant_id, from_location_id, to_location_id, qty, status, 
     lalamove_ref, note, initiated_by, transfer_out_tx_id, picked_up_at)
  VALUES
    (p_variant_id, p_from_location_id, p_to_location_id, p_qty, 'IN_TRANSIT',
     p_lalamove_ref, p_note, p_performed_by, v_tx_out_id, now())
  RETURNING id INTO v_transfer_id;

  -- Link transfer_ref back to the OUT transaction
  UPDATE inventory.stock_transactions
    SET transfer_ref = v_transfer_id
  WHERE id = v_tx_out_id;

  RETURN v_transfer_id;
END;
$$;


ALTER FUNCTION "inventory"."initiate_transfer"("p_variant_id" "uuid", "p_from_location_id" "uuid", "p_to_location_id" "uuid", "p_qty" numeric, "p_note" "text", "p_performed_by" "uuid", "p_lalamove_ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dev_reset_today_attendance"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM public.attendance
  WHERE date = (now() AT TIME ZONE 'Asia/Jakarta')::date;
END;
$$;


ALTER FUNCTION "public"."dev_reset_today_attendance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ecom_decrement_stock"("p_variant_id" "uuid", "p_quantity" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  rows_affected INT;
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id AND stock_quantity >= p_quantity;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;


ALTER FUNCTION "public"."ecom_decrement_stock"("p_variant_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ecom_restore_stock"("p_variant_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_variant_id;
END;
$$;


ALTER FUNCTION "public"."ecom_restore_stock"("p_variant_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ecom_update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ecom_update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  today    TEXT := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
  next_seq INTEGER;
BEGIN
  INSERT INTO order_number_sequences (date_key, last_seq)
  VALUES (today, 1)
  ON CONFLICT (date_key)
  DO UPDATE SET last_seq = order_number_sequences.last_seq + 1
  RETURNING last_seq INTO next_seq;

  RETURN 'ORD-' || today || '-' || LPAD(next_seq::TEXT, 3, '0');
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_client"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = NEW.email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      NEW.email,
      '',
      now(),
      '{"provider":"google","providers":["google"]}',
      jsonb_build_object('email', NEW.email, 'email_verified', true),
      now(), now(),
      '', '', '', ''
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_bonus_policy_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO config_audit_log (
    config_type,
    config_id,
    action,
    performed_by,
    snapshot
  )
  VALUES (
    'bonus_policy',
    NEW.id,
    'INSERT',
    NEW.created_by,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_bonus_policy_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_update_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RAISE EXCEPTION 'Attendance records are immutable. UPDATE and DELETE are not allowed.';
END;
$$;


ALTER FUNCTION "public"."prevent_update_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "inventory"."beans_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "stock_in_date" "date" NOT NULL,
    "roast_date" "date",
    "beans_in_grams" numeric NOT NULL,
    "beans_remaining_grams" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "cupping_score" numeric,
    "cupping_notes" "text",
    "performed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beans_batches_beans_in_grams_check" CHECK (("beans_in_grams" > (0)::numeric)),
    CONSTRAINT "beans_batches_status_check" CHECK (("status" = ANY (ARRAY['ACTIVE'::"text", 'BUFFER'::"text", 'DEPLETED'::"text"])))
);


ALTER TABLE "inventory"."beans_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."stock_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "inventory"."stock_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."stock_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "qty" numeric NOT NULL,
    "note" "text",
    "source" "text" DEFAULT 'MANUAL'::"text" NOT NULL,
    "performed_by" "uuid",
    "performed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "transfer_ref" "uuid",
    CONSTRAINT "stock_transactions_qty_check" CHECK (("qty" > (0)::numeric)),
    CONSTRAINT "stock_transactions_source_check" CHECK (("source" = ANY (ARRAY['MANUAL'::"text", 'JUBELIO'::"text", 'SYSTEM'::"text"]))),
    CONSTRAINT "stock_transactions_type_check" CHECK (("type" = ANY (ARRAY['IN'::"text", 'OUT'::"text", 'CLOSING'::"text", 'RETURN'::"text", 'ADJUSTMENT'::"text", 'TRANSFER_OUT'::"text", 'TRANSFER_IN'::"text"])))
);


ALTER TABLE "inventory"."stock_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."stock_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "unit" "text" NOT NULL,
    "stock_min" numeric DEFAULT 0,
    "stock_alert" numeric DEFAULT 0,
    "stock_max" numeric,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_variants_unit_check" CHECK (("unit" = ANY (ARRAY['gram'::"text", 'pcs'::"text"])))
);


ALTER TABLE "inventory"."stock_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "wifi_ssid" "text",
    "telegram_topic_id" bigint,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "inventory"."stock_catalogue" AS
 SELECT "sv"."id" AS "variant_id",
    "sc"."name" AS "category",
    "sv"."name" AS "variant",
    "sv"."unit",
    "l"."id" AS "location_id",
    "l"."name" AS "location",
    "sv"."stock_min",
    "sv"."stock_alert",
    "sv"."stock_max",
    COALESCE("sum"(
        CASE
            WHEN ("st"."type" = ANY (ARRAY['IN'::"text", 'TRANSFER_IN'::"text"])) THEN "st"."qty"
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_in",
    COALESCE("sum"(
        CASE
            WHEN ("st"."type" = ANY (ARRAY['OUT'::"text", 'CLOSING'::"text", 'RETURN'::"text", 'TRANSFER_OUT'::"text"])) THEN "st"."qty"
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_out",
    COALESCE("sum"(
        CASE
            WHEN ("st"."type" = ANY (ARRAY['IN'::"text", 'TRANSFER_IN'::"text"])) THEN "st"."qty"
            WHEN ("st"."type" = ANY (ARRAY['OUT'::"text", 'CLOSING'::"text", 'RETURN'::"text", 'TRANSFER_OUT'::"text"])) THEN (- "st"."qty")
            ELSE (0)::numeric
        END), (0)::numeric) AS "remaining",
        CASE
            WHEN (COALESCE("sum"(
            CASE
                WHEN ("st"."type" = ANY (ARRAY['IN'::"text", 'TRANSFER_IN'::"text"])) THEN "st"."qty"
                WHEN ("st"."type" = ANY (ARRAY['OUT'::"text", 'CLOSING'::"text", 'RETURN'::"text", 'TRANSFER_OUT'::"text"])) THEN (- "st"."qty")
                ELSE (0)::numeric
            END), (0)::numeric) <= "sv"."stock_alert") THEN 'ALERT'::"text"
            WHEN (COALESCE("sum"(
            CASE
                WHEN ("st"."type" = ANY (ARRAY['IN'::"text", 'TRANSFER_IN'::"text"])) THEN "st"."qty"
                WHEN ("st"."type" = ANY (ARRAY['OUT'::"text", 'CLOSING'::"text", 'RETURN'::"text", 'TRANSFER_OUT'::"text"])) THEN (- "st"."qty")
                ELSE (0)::numeric
            END), (0)::numeric) <= "sv"."stock_min") THEN 'LOW'::"text"
            ELSE 'OK'::"text"
        END AS "stock_status"
   FROM ((("inventory"."stock_variants" "sv"
     JOIN "inventory"."stock_categories" "sc" ON (("sv"."category_id" = "sc"."id")))
     LEFT JOIN "inventory"."stock_transactions" "st" ON (("st"."variant_id" = "sv"."id")))
     LEFT JOIN "public"."locations" "l" ON (("st"."location_id" = "l"."id")))
  WHERE ("sv"."is_active" = true)
  GROUP BY "sv"."id", "sc"."name", "sv"."name", "sv"."unit", "l"."id", "l"."name", "sv"."stock_min", "sv"."stock_alert", "sv"."stock_max";


ALTER VIEW "inventory"."stock_catalogue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."stock_returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "return_date" "date" NOT NULL,
    "weight_grams" numeric NOT NULL,
    "reason" "text",
    "channel" "text",
    "disposition" "text" NOT NULL,
    "roast_date" "date",
    "performed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_returns_channel_check" CHECK (("channel" = ANY (ARRAY['SHOPEE'::"text", 'TOKOPEDIA'::"text", 'MANUAL'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "stock_returns_disposition_check" CHECK (("disposition" = ANY (ARRAY['DONATED'::"text", 'RESOLD'::"text", 'BOXED'::"text"]))),
    CONSTRAINT "stock_returns_weight_grams_check" CHECK (("weight_grams" > (0)::numeric))
);


ALTER TABLE "inventory"."stock_returns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."stock_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "from_location_id" "uuid" NOT NULL,
    "to_location_id" "uuid" NOT NULL,
    "qty" numeric NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "lalamove_ref" "text",
    "initiated_at" timestamp with time zone DEFAULT "now"(),
    "picked_up_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "initiated_by" "uuid",
    "confirmed_by" "uuid",
    "note" "text",
    "transfer_out_tx_id" "uuid",
    "transfer_in_tx_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_transfers_qty_check" CHECK (("qty" > (0)::numeric)),
    CONSTRAINT "stock_transfers_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'IN_TRANSIT'::"text", 'DELIVERED'::"text", 'CANCELLED'::"text"])))
);


ALTER TABLE "inventory"."stock_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "telegram_user_id" bigint NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "employees_role_check" CHECK (("role" = ANY (ARRAY['employee'::"text", 'admin'::"text", 'owner'::"text"])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE OR REPLACE VIEW "inventory"."transfers_in_transit" AS
 SELECT "st"."id" AS "transfer_id",
    "sv"."name" AS "variant",
    "sc"."name" AS "category",
    "fl"."name" AS "from_location",
    "tl"."name" AS "to_location",
    "st"."qty",
    "sv"."unit",
    "st"."lalamove_ref",
    "st"."picked_up_at",
    "st"."note",
    "e"."name" AS "initiated_by",
    "st"."initiated_at"
   FROM ((((("inventory"."stock_transfers" "st"
     JOIN "inventory"."stock_variants" "sv" ON (("st"."variant_id" = "sv"."id")))
     JOIN "inventory"."stock_categories" "sc" ON (("sv"."category_id" = "sc"."id")))
     JOIN "public"."locations" "fl" ON (("st"."from_location_id" = "fl"."id")))
     JOIN "public"."locations" "tl" ON (("st"."to_location_id" = "tl"."id")))
     LEFT JOIN "public"."employees" "e" ON (("st"."initiated_by" = "e"."id")))
  WHERE ("st"."status" = 'IN_TRANSIT'::"text");


ALTER VIEW "inventory"."transfers_in_transit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "label" "text",
    "recipient_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "address_line" "text" NOT NULL,
    "postal_code" "text",
    "latitude" double precision,
    "longitude" double precision,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "telegram_user_id" bigint NOT NULL,
    "date" "date" NOT NULL,
    "checkin_time" timestamp with time zone NOT NULL,
    "wifi_confirmed" boolean NOT NULL,
    "source" "text" NOT NULL,
    "is_manual" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "schedule_id" "uuid" NOT NULL
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_schedule_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "effective_from" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "employee_schedule_assignments_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."employee_schedule_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "shift_name" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "grace_minutes" integer DEFAULT 5 NOT NULL,
    "effective_from" "date" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "schedules_grace_minutes_check" CHECK (("grace_minutes" >= 0))
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_absence_view" AS
 WITH "date_series" AS (
         SELECT ("generate_series"((CURRENT_DATE - '90 days'::interval), (CURRENT_DATE)::timestamp without time zone, '1 day'::interval))::"date" AS "work_date"
        ), "expected" AS (
         SELECT "ds"."work_date",
            "esa"."employee_id",
            "esa"."schedule_id",
            "e"."name" AS "employee_name",
            "e"."email",
            "s"."shift_name",
            "s"."start_time",
            "s"."location_id",
            "l"."name" AS "location_name",
            "l"."code" AS "location_code"
           FROM (((("date_series" "ds"
             JOIN "public"."employee_schedule_assignments" "esa" ON ((("esa"."day_of_week" = (EXTRACT(dow FROM "ds"."work_date"))::integer) AND ("esa"."effective_from" <= "ds"."work_date"))))
             JOIN "public"."employees" "e" ON (("e"."id" = "esa"."employee_id")))
             JOIN "public"."schedules" "s" ON ((("s"."id" = "esa"."schedule_id") AND ("s"."is_active" = true) AND ("s"."effective_from" <= "ds"."work_date"))))
             JOIN "public"."locations" "l" ON (("l"."id" = "s"."location_id")))
        )
 SELECT "ex"."work_date" AS "date",
    "ex"."employee_id",
    "ex"."employee_name",
    "ex"."email",
    "ex"."schedule_id",
    "ex"."shift_name",
    "ex"."start_time",
    "ex"."location_id",
    "ex"."location_name",
    "ex"."location_code",
    'absent'::"text" AS "status"
   FROM ("expected" "ex"
     LEFT JOIN "public"."attendance" "a" ON ((("a"."employee_id" = "ex"."employee_id") AND ("a"."date" = "ex"."work_date") AND ("a"."schedule_id" = "ex"."schedule_id"))))
  WHERE ("a"."id" IS NULL)
  ORDER BY "ex"."work_date" DESC, "ex"."employee_name";


ALTER VIEW "public"."attendance_absence_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_absence_secure" WITH ("security_barrier"='true') AS
 SELECT "av"."date",
    "av"."employee_id",
    "av"."employee_name",
    "av"."email",
    "av"."schedule_id",
    "av"."shift_name",
    "av"."start_time",
    "av"."location_id",
    "av"."location_name",
    "av"."location_code",
    "av"."status"
   FROM ("public"."attendance_absence_view" "av"
     JOIN "public"."employees" "e" ON (("e"."id" = "av"."employee_id")))
  WHERE (("e"."email" = "auth"."email"()) OR (EXISTS ( SELECT 1
           FROM "public"."employees" "me"
          WHERE (("me"."email" = "auth"."email"()) AND ("me"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));


ALTER VIEW "public"."attendance_absence_secure" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_daily_view" AS
 SELECT "a"."id",
    "a"."employee_id",
    "a"."date",
    "a"."checkin_time",
    "a"."location_id",
    "a"."schedule_id",
    "s"."shift_name",
    "s"."start_time",
    "s"."grace_minutes",
    ("a"."checkin_time" AT TIME ZONE 'Asia/Jakarta'::"text") AS "checkin_local_timestamp",
    (("a"."checkin_time" AT TIME ZONE 'Asia/Jakarta'::"text"))::time without time zone AS "checkin_local_time",
    ("s"."start_time" + (("s"."grace_minutes" || ' minutes'::"text"))::interval) AS "cutoff_time",
    (GREATEST("floor"((EXTRACT(epoch FROM (("a"."checkin_time" AT TIME ZONE 'Asia/Jakarta'::"text") - ((("a"."date")::timestamp without time zone + ("s"."start_time")::interval) + (("s"."grace_minutes" || ' minutes'::"text"))::interval))) / (60)::numeric)), (0)::numeric))::integer AS "lateness_minutes",
    (GREATEST("floor"((EXTRACT(epoch FROM (("a"."checkin_time" AT TIME ZONE 'Asia/Jakarta'::"text") - ((("a"."date")::timestamp without time zone + ("s"."start_time")::interval) + (("s"."grace_minutes" || ' minutes'::"text"))::interval))) / (60)::numeric)), (0)::numeric) > (0)::numeric) AS "is_late",
    "a"."wifi_confirmed",
    "a"."source",
    "a"."is_manual"
   FROM ("public"."attendance" "a"
     JOIN "public"."schedules" "s" ON (("s"."id" = "a"."schedule_id")));


ALTER VIEW "public"."attendance_daily_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_daily_secure" WITH ("security_barrier"='true') AS
 SELECT "d"."id",
    "d"."employee_id",
    "e"."name" AS "employee_name",
    "d"."date",
    "d"."checkin_time",
    "d"."location_id",
    "l"."name" AS "location_name",
    "l"."code" AS "location_code",
    "d"."schedule_id",
    "d"."shift_name",
    "d"."start_time",
    "d"."checkin_local_time",
    "d"."cutoff_time",
    "d"."is_late",
    "d"."lateness_minutes",
    "d"."wifi_confirmed",
    "d"."source",
    "d"."is_manual"
   FROM (("public"."attendance_daily_view" "d"
     JOIN "public"."employees" "e" ON (("e"."id" = "d"."employee_id")))
     JOIN "public"."locations" "l" ON (("l"."id" = "d"."location_id")))
  WHERE (("e"."email" = "auth"."email"()) OR (EXISTS ( SELECT 1
           FROM "public"."employees" "a"
          WHERE (("a"."email" = "auth"."email"()) AND ("a"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));


ALTER VIEW "public"."attendance_daily_secure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bonus_policy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "effective_from" "date" NOT NULL,
    "max_late" integer NOT NULL,
    "bonus_multiplier" numeric NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bonus_policy_bonus_multiplier_check" CHECK (("bonus_multiplier" >= (0)::numeric)),
    CONSTRAINT "bonus_policy_max_late_check" CHECK (("max_late" >= 0))
);


ALTER TABLE "public"."bonus_policy" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_monthly_bonus" AS
 SELECT "m"."employee_id",
    "m"."month",
    "m"."late_days",
    "bp"."bonus_multiplier"
   FROM (( SELECT "attendance_daily_view"."employee_id",
            ("date_trunc"('month'::"text", ("attendance_daily_view"."date")::timestamp without time zone))::"date" AS "month",
            "count"(*) FILTER (WHERE "attendance_daily_view"."is_late") AS "late_days"
           FROM "public"."attendance_daily_view"
          GROUP BY "attendance_daily_view"."employee_id", (("date_trunc"('month'::"text", ("attendance_daily_view"."date")::timestamp without time zone))::"date")) "m"
     JOIN LATERAL ( SELECT "bp_1"."bonus_multiplier"
           FROM "public"."bonus_policy" "bp_1"
          WHERE (("bp_1"."effective_from" <= "m"."month") AND ("m"."late_days" <= "bp_1"."max_late"))
          ORDER BY "bp_1"."effective_from" DESC, "bp_1"."max_late"
         LIMIT 1) "bp" ON (true));


ALTER VIEW "public"."attendance_monthly_bonus" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_monthly_bonus_secure" WITH ("security_barrier"='true') AS
 SELECT "m"."employee_id",
    "m"."month",
    "m"."late_days",
    "m"."bonus_multiplier"
   FROM ("public"."attendance_monthly_bonus" "m"
     JOIN "public"."employees" "e" ON (("e"."id" = "m"."employee_id")))
  WHERE (("e"."email" = "auth"."email"()) OR (EXISTS ( SELECT 1
           FROM "public"."employees" "a"
          WHERE (("a"."email" = "auth"."email"()) AND ("a"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));


ALTER VIEW "public"."attendance_monthly_bonus_secure" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_weekly_summary" AS
 SELECT "employee_id",
    ("date_trunc"('week'::"text", ("date")::timestamp without time zone))::"date" AS "week_start_date",
    "count"(*) AS "present_days",
    "count"(*) FILTER (WHERE "is_late") AS "late_days",
    "count"(*) FILTER (WHERE (NOT "is_late")) AS "on_time_days"
   FROM "public"."attendance_daily_view"
  GROUP BY "employee_id", (("date_trunc"('week'::"text", ("date")::timestamp without time zone))::"date");


ALTER VIEW "public"."attendance_weekly_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."attendance_weekly_secure" WITH ("security_barrier"='true') AS
 SELECT "w"."employee_id",
    "w"."week_start_date",
    "w"."present_days",
    "w"."late_days",
    "w"."on_time_days"
   FROM ("public"."attendance_weekly_summary" "w"
     JOIN "public"."employees" "e" ON (("e"."id" = "w"."employee_id")))
  WHERE (("e"."email" = "auth"."email"()) OR (EXISTS ( SELECT 1
           FROM "public"."employees" "a"
          WHERE (("a"."email" = "auth"."email"()) AND ("a"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));


ALTER VIEW "public"."attendance_weekly_secure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "variant_id" "uuid",
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "custom_price" numeric,
    "min_qty" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."client_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."config_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_type" "text" NOT NULL,
    "config_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "performed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "snapshot" "jsonb" NOT NULL,
    CONSTRAINT "config_audit_log_action_check" CHECK (("action" = 'INSERT'::"text")),
    CONSTRAINT "config_audit_log_config_type_check" CHECK (("config_type" = ANY (ARRAY['attendance_rules'::"text", 'bonus_policy'::"text", 'employee'::"text"])))
);


ALTER TABLE "public"."config_audit_log" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."current_employee" AS
 SELECT "id",
    "email",
    "role"
   FROM "public"."employees"
  WHERE ("email" = "auth"."email"());


ALTER VIEW "public"."current_employee" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ecom_notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "channel" "text" DEFAULT 'telegram'::"text" NOT NULL,
    "order_id" "uuid",
    "order_number" "text",
    "message" "text" NOT NULL,
    "status" "text" NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ecom_notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ecom_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "variant_id" "uuid",
    "product_name" "text" NOT NULL,
    "variant_description" "text" NOT NULL,
    "unit_price" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "subtotal" bigint NOT NULL,
    "ship_weight_grams" integer NOT NULL,
    "sku" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ecom_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ecom_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "order_number" "text" NOT NULL,
    "status" "text" DEFAULT 'pending_payment'::"text" NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_email" "text",
    "customer_phone" "text" NOT NULL,
    "shipping_address" "jsonb" NOT NULL,
    "shipping_courier" "text",
    "shipping_service" "text",
    "shipping_cost" bigint DEFAULT 0 NOT NULL,
    "shipping_etd" "text",
    "tracking_number" "text",
    "biteship_order_id" "text",
    "xendit_invoice_id" "text",
    "xendit_payment_method" "text",
    "payment_status" "text" DEFAULT 'unpaid'::"text",
    "paid_at" timestamp with time zone,
    "subtotal" bigint NOT NULL,
    "total" bigint NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "pivot_payment_session_id" "text",
    "pivot_qr_url" "text",
    "pivot_qr_expires_at" timestamp with time zone,
    "pivot_qr_string" "text",
    "jubelio_salesorder_id" bigint,
    "jubelio_invoice_no" "text",
    CONSTRAINT "ecom_orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['unpaid'::"text", 'paid'::"text", 'expired'::"text", 'refunded'::"text"]))),
    CONSTRAINT "ecom_orders_status_check" CHECK (("status" = ANY (ARRAY['pending_payment'::"text", 'paid'::"text", 'processing'::"text", 'shipped'::"text", 'delivered'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."ecom_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jubelio_invoices" (
    "doc_id" bigint NOT NULL,
    "doc_number" "text",
    "customer_name" "text",
    "grand_total" numeric,
    "due" numeric,
    "doc_type" "text",
    "transaction_date" timestamp with time zone,
    "due_date" "date",
    "report_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jubelio_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jubelio_transactions" (
    "doc_id" bigint NOT NULL,
    "doc_number" "text",
    "customer_name" "text",
    "grand_total" numeric,
    "due" numeric,
    "doc_type" "text",
    "transaction_date" timestamp with time zone,
    "due_date" "date",
    "report_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jubelio_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jubelio_webhook_events" (
    "id" bigint NOT NULL,
    "event_type" "text" NOT NULL,
    "action" "text",
    "ref_id" bigint,
    "ref_no" "text",
    "payload" "jsonb" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jubelio_webhook_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."jubelio_webhook_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."jubelio_webhook_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."jubelio_webhook_events_id_seq" OWNED BY "public"."jubelio_webhook_events"."id";



CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "order_number" "text" NOT NULL,
    "channel" "text" DEFAULT 'telegram'::"text" NOT NULL,
    "status" "text" NOT NULL,
    "error" "text",
    "attempted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_logs_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_name" "text" NOT NULL,
    "unit_price" numeric NOT NULL,
    "quantity" integer NOT NULL,
    "subtotal" numeric NOT NULL,
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" >= 1))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_number_sequences" (
    "date_key" "text" NOT NULL,
    "last_seq" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."order_number_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_number" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "notes" "text",
    "admin_notes" "text",
    "total_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'CONFIRMED'::"text", 'SHIPPED'::"text", 'DELIVERED'::"text", 'PAID'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_option_values" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "option_id" "uuid",
    "value" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_option_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "name" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variant_option_values" (
    "variant_id" "uuid" NOT NULL,
    "option_value_id" "uuid" NOT NULL
);


ALTER TABLE "public"."product_variant_option_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "sku" "text",
    "price" bigint NOT NULL,
    "compare_at_price" bigint,
    "stock_quantity" integer DEFAULT 0,
    "ship_weight_grams" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "unit" "text" NOT NULL,
    "sku" "text",
    "base_price" numeric NOT NULL,
    "image_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "is_global" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text",
    "short_description" "text",
    "category_ids" "text"[] DEFAULT '{}'::"text"[],
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "default_address_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."jubelio_webhook_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."jubelio_webhook_events_id_seq"'::"regclass");



ALTER TABLE ONLY "inventory"."beans_batches"
    ADD CONSTRAINT "beans_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."stock_categories"
    ADD CONSTRAINT "stock_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "inventory"."stock_categories"
    ADD CONSTRAINT "stock_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."stock_returns"
    ADD CONSTRAINT "stock_returns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."stock_transactions"
    ADD CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."stock_variants"
    ADD CONSTRAINT "stock_variants_category_id_name_key" UNIQUE ("category_id", "name");



ALTER TABLE ONLY "inventory"."stock_variants"
    ADD CONSTRAINT "stock_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bonus_policy"
    ADD CONSTRAINT "bonus_policy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_user_id_variant_id_key" UNIQUE ("user_id", "variant_id");



ALTER TABLE ONLY "public"."client_products"
    ADD CONSTRAINT "client_products_client_id_product_id_key" UNIQUE ("client_id", "product_id");



ALTER TABLE ONLY "public"."client_products"
    ADD CONSTRAINT "client_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."config_audit_log"
    ADD CONSTRAINT "config_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ecom_notification_logs"
    ADD CONSTRAINT "ecom_notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ecom_order_items"
    ADD CONSTRAINT "ecom_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ecom_orders"
    ADD CONSTRAINT "ecom_orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."ecom_orders"
    ADD CONSTRAINT "ecom_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_schedule_assignments"
    ADD CONSTRAINT "employee_schedule_assignments_employee_id_day_of_week_effec_key" UNIQUE ("employee_id", "day_of_week", "effective_from");



ALTER TABLE ONLY "public"."employee_schedule_assignments"
    ADD CONSTRAINT "employee_schedule_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_telegram_user_id_key" UNIQUE ("telegram_user_id");



ALTER TABLE ONLY "public"."jubelio_invoices"
    ADD CONSTRAINT "jubelio_invoices_pkey" PRIMARY KEY ("doc_id");



ALTER TABLE ONLY "public"."jubelio_transactions"
    ADD CONSTRAINT "jubelio_transactions_pkey" PRIMARY KEY ("doc_id");



ALTER TABLE ONLY "public"."jubelio_webhook_events"
    ADD CONSTRAINT "jubelio_webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_number_sequences"
    ADD CONSTRAINT "order_number_sequences_pkey" PRIMARY KEY ("date_key");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_options"
    ADD CONSTRAINT "product_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variant_option_values"
    ADD CONSTRAINT "product_variant_option_values_pkey" PRIMARY KEY ("variant_id", "option_value_id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "unique_employee_per_day" UNIQUE ("employee_id", "date");



CREATE INDEX "idx_assignment_day" ON "public"."employee_schedule_assignments" USING "btree" ("day_of_week");



CREATE INDEX "idx_assignment_employee" ON "public"."employee_schedule_assignments" USING "btree" ("employee_id");



CREATE INDEX "idx_attendance_date" ON "public"."attendance" USING "btree" ("date");



CREATE INDEX "idx_attendance_employee_id" ON "public"."attendance" USING "btree" ("employee_id");



CREATE INDEX "idx_attendance_location_id" ON "public"."attendance" USING "btree" ("location_id");



CREATE INDEX "idx_attendance_schedule_id" ON "public"."attendance" USING "btree" ("schedule_id");



CREATE INDEX "idx_cart_items_user" ON "public"."cart_items" USING "btree" ("user_id");



CREATE INDEX "idx_client_products_client_id" ON "public"."client_products" USING "btree" ("client_id");



CREATE INDEX "idx_ecom_notification_logs_created" ON "public"."ecom_notification_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ecom_notification_logs_order" ON "public"."ecom_notification_logs" USING "btree" ("order_id");



CREATE INDEX "idx_ecom_notification_logs_status" ON "public"."ecom_notification_logs" USING "btree" ("status");



CREATE INDEX "idx_ecom_notification_logs_type" ON "public"."ecom_notification_logs" USING "btree" ("type");



CREATE INDEX "idx_ecom_order_items_order" ON "public"."ecom_order_items" USING "btree" ("order_id");
CREATE INDEX "idx_ecom_order_items_sku" ON "public"."ecom_order_items" USING "btree" ("sku");



CREATE INDEX "idx_ecom_orders_number" ON "public"."ecom_orders" USING "btree" ("order_number");



CREATE INDEX "idx_ecom_orders_pivot" ON "public"."ecom_orders" USING "btree" ("pivot_payment_session_id");



CREATE INDEX "idx_ecom_orders_user" ON "public"."ecom_orders" USING "btree" ("user_id");



CREATE INDEX "idx_ecom_orders_xendit" ON "public"."ecom_orders" USING "btree" ("xendit_invoice_id");



CREATE INDEX "idx_employees_email" ON "public"."employees" USING "btree" ("email");



CREATE INDEX "idx_jubelio_invoices_report_date" ON "public"."jubelio_invoices" USING "btree" ("report_date");



CREATE INDEX "idx_jubelio_transactions_report_date" ON "public"."jubelio_transactions" USING "btree" ("report_date");



CREATE INDEX "idx_notification_logs_status" ON "public"."notification_logs" USING "btree" ("status", "attempted_at" DESC);



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_client_id_created" ON "public"."orders" USING "btree" ("client_id", "created_at" DESC);



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_product_variants_product" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_product_variants_sku" ON "public"."product_variants" USING "btree" ("sku");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_products_slug" ON "public"."products" USING "btree" ("slug");



CREATE INDEX "idx_schedules_effective_from" ON "public"."schedules" USING "btree" ("effective_from");



CREATE INDEX "idx_schedules_location_id" ON "public"."schedules" USING "btree" ("location_id");



CREATE INDEX "idx_webhook_events_event_type" ON "public"."jubelio_webhook_events" USING "btree" ("event_type");



CREATE INDEX "idx_webhook_events_received_at" ON "public"."jubelio_webhook_events" USING "btree" ("received_at" DESC);



CREATE INDEX "idx_webhook_events_ref_id" ON "public"."jubelio_webhook_events" USING "btree" ("ref_id");



CREATE UNIQUE INDEX "locations_code_unique" ON "public"."locations" USING "btree" ("code");



CREATE OR REPLACE TRIGGER "on_client_created" AFTER INSERT ON "public"."clients" FOR EACH ROW WHEN (("new"."is_active" = true)) EXECUTE FUNCTION "public"."handle_new_client"();



CREATE OR REPLACE TRIGGER "on_client_reactivated" AFTER UPDATE ON "public"."clients" FOR EACH ROW WHEN ((("old"."is_active" = false) AND ("new"."is_active" = true))) EXECUTE FUNCTION "public"."handle_new_client"();



CREATE OR REPLACE TRIGGER "orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_cart_items_updated_at" BEFORE UPDATE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."ecom_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_ecom_orders_updated_at" BEFORE UPDATE ON "public"."ecom_orders" FOR EACH ROW EXECUTE FUNCTION "public"."ecom_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_product_variants_updated_at" BEFORE UPDATE ON "public"."product_variants" FOR EACH ROW EXECUTE FUNCTION "public"."ecom_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."ecom_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ecom_update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_log_bonus_policy_insert" AFTER INSERT ON "public"."bonus_policy" FOR EACH ROW EXECUTE FUNCTION "public"."log_bonus_policy_insert"();



CREATE OR REPLACE TRIGGER "trigger_prevent_bonus_policy_update_delete" BEFORE DELETE OR UPDATE ON "public"."bonus_policy" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_update_delete"();



CREATE OR REPLACE TRIGGER "trigger_prevent_config_audit_update_delete" BEFORE DELETE OR UPDATE ON "public"."config_audit_log" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_update_delete"();



CREATE OR REPLACE TRIGGER "trigger_prevent_update_delete_attendance" BEFORE DELETE OR UPDATE ON "public"."attendance" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_update_delete"();

ALTER TABLE "public"."attendance" DISABLE TRIGGER "trigger_prevent_update_delete_attendance";



ALTER TABLE ONLY "inventory"."beans_batches"
    ADD CONSTRAINT "beans_batches_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "inventory"."beans_batches"
    ADD CONSTRAINT "beans_batches_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "inventory"."beans_batches"
    ADD CONSTRAINT "beans_batches_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "inventory"."stock_variants"("id");



ALTER TABLE ONLY "inventory"."stock_returns"
    ADD CONSTRAINT "stock_returns_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "inventory"."stock_returns"
    ADD CONSTRAINT "stock_returns_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "inventory"."stock_returns"
    ADD CONSTRAINT "stock_returns_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "inventory"."stock_variants"("id");



ALTER TABLE ONLY "inventory"."stock_transactions"
    ADD CONSTRAINT "stock_transactions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "inventory"."stock_transactions"
    ADD CONSTRAINT "stock_transactions_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "inventory"."stock_transactions"
    ADD CONSTRAINT "stock_transactions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "inventory"."stock_variants"("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_transfer_in_tx_id_fkey" FOREIGN KEY ("transfer_in_tx_id") REFERENCES "inventory"."stock_transactions"("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_transfer_out_tx_id_fkey" FOREIGN KEY ("transfer_out_tx_id") REFERENCES "inventory"."stock_transactions"("id");



ALTER TABLE ONLY "inventory"."stock_transfers"
    ADD CONSTRAINT "stock_transfers_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "inventory"."stock_variants"("id");



ALTER TABLE ONLY "inventory"."stock_variants"
    ADD CONSTRAINT "stock_variants_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory"."stock_categories"("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id");



ALTER TABLE ONLY "public"."bonus_policy"
    ADD CONSTRAINT "bonus_policy_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_products"
    ADD CONSTRAINT "client_products_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_products"
    ADD CONSTRAINT "client_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."config_audit_log"
    ADD CONSTRAINT "config_audit_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."ecom_notification_logs"
    ADD CONSTRAINT "ecom_notification_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ecom_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ecom_order_items"
    ADD CONSTRAINT "ecom_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."ecom_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ecom_order_items"
    ADD CONSTRAINT "ecom_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ecom_orders"
    ADD CONSTRAINT "ecom_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_schedule_assignments"
    ADD CONSTRAINT "employee_schedule_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_schedule_assignments"
    ADD CONSTRAINT "employee_schedule_assignments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_options"
    ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variant_option_values"
    ADD CONSTRAINT "product_variant_option_values_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "public"."product_option_values"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variant_option_values"
    ADD CONSTRAINT "product_variant_option_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_default_address_id_fkey" FOREIGN KEY ("default_address_id") REFERENCES "public"."addresses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage own addresses" ON "public"."addresses" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own cart" ON "public"."cart_items" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own order items" ON "public"."ecom_order_items" FOR SELECT USING (("order_id" IN ( SELECT "ecom_orders"."id"
   FROM "public"."ecom_orders"
  WHERE ("ecom_orders"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own orders" ON "public"."ecom_orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "assignment_delete" ON "public"."employee_schedule_assignments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "me"
  WHERE (("me"."email" = "auth"."email"()) AND ("me"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "assignment_insert" ON "public"."employee_schedule_assignments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "me"
  WHERE (("me"."email" = "auth"."email"()) AND ("me"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "assignment_read" ON "public"."employee_schedule_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."id" = "employee_schedule_assignments"."employee_id") AND (("e"."email" = "auth"."email"()) OR (EXISTS ( SELECT 1
           FROM "public"."employees" "me"
          WHERE (("me"."email" = "auth"."email"()) AND ("me"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))))))));



CREATE POLICY "assignment_update" ON "public"."employee_schedule_assignments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "me"
  WHERE (("me"."email" = "auth"."email"()) AND ("me"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_products_client_read" ON "public"."client_products" FOR SELECT USING (("client_id" = ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_self_read" ON "public"."clients" FOR SELECT USING (("email" = ("auth"."jwt"() ->> 'email'::"text")));



ALTER TABLE "public"."ecom_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ecom_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_schedule_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_bootstrap_self" ON "public"."employees" FOR SELECT TO "authenticated" USING (("email" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "employees_self" ON "public"."employees" FOR SELECT USING (("auth"."email"() = "email"));



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_insert" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "locations_insert_admin" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "locations_read" ON "public"."locations" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "locations_update_admin" ON "public"."locations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_client_insert" ON "public"."order_items" FOR INSERT WITH CHECK (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."client_id" = ( SELECT "clients"."id"
           FROM "public"."clients"
          WHERE ("clients"."email" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "order_items_client_read" ON "public"."order_items" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."client_id" = ( SELECT "clients"."id"
           FROM "public"."clients"
          WHERE ("clients"."email" = ("auth"."jwt"() ->> 'email'::"text")))))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_client_insert" ON "public"."orders" FOR INSERT WITH CHECK (("client_id" = ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "orders_client_read" ON "public"."orders" FOR SELECT USING (("client_id" = ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_client_read" ON "public"."products" FOR SELECT USING ((("is_global" = true) OR ("id" IN ( SELECT "client_products"."product_id"
   FROM "public"."client_products"
  WHERE ("client_products"."client_id" = ( SELECT "clients"."id"
           FROM "public"."clients"
          WHERE ("clients"."email" = ("auth"."jwt"() ->> 'email'::"text"))))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedules_insert" ON "public"."schedules" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "schedules_insert_admin" ON "public"."schedules" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "schedules_read" ON "public"."schedules" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "schedules_update_admin" ON "public"."schedules" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."email" = "auth"."email"()) AND ("e"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "inventory" TO "anon";
GRANT USAGE ON SCHEMA "inventory" TO "authenticated";
GRANT USAGE ON SCHEMA "inventory" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "inventory"."confirm_transfer"("p_transfer_id" "uuid", "p_confirmed_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "inventory"."confirm_transfer"("p_transfer_id" "uuid", "p_confirmed_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."confirm_transfer"("p_transfer_id" "uuid", "p_confirmed_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "inventory"."initiate_transfer"("p_variant_id" "uuid", "p_from_location_id" "uuid", "p_to_location_id" "uuid", "p_qty" numeric, "p_note" "text", "p_performed_by" "uuid", "p_lalamove_ref" "text") TO "anon";
GRANT ALL ON FUNCTION "inventory"."initiate_transfer"("p_variant_id" "uuid", "p_from_location_id" "uuid", "p_to_location_id" "uuid", "p_qty" numeric, "p_note" "text", "p_performed_by" "uuid", "p_lalamove_ref" "text") TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."initiate_transfer"("p_variant_id" "uuid", "p_from_location_id" "uuid", "p_to_location_id" "uuid", "p_qty" numeric, "p_note" "text", "p_performed_by" "uuid", "p_lalamove_ref" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."dev_reset_today_attendance"() TO "anon";
GRANT ALL ON FUNCTION "public"."dev_reset_today_attendance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."dev_reset_today_attendance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ecom_decrement_stock"("p_variant_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."ecom_decrement_stock"("p_variant_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ecom_decrement_stock"("p_variant_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ecom_restore_stock"("p_variant_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."ecom_restore_stock"("p_variant_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ecom_restore_stock"("p_variant_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ecom_update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."ecom_update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ecom_update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_bonus_policy_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_bonus_policy_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_bonus_policy_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_update_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_update_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_update_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT SELECT ON TABLE "inventory"."beans_batches" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."beans_batches" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."beans_batches" TO "service_role";



GRANT SELECT ON TABLE "inventory"."stock_categories" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_categories" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_categories" TO "service_role";



GRANT SELECT ON TABLE "inventory"."stock_transactions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_transactions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_transactions" TO "service_role";



GRANT SELECT ON TABLE "inventory"."stock_variants" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_variants" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_variants" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT SELECT ON TABLE "inventory"."stock_catalogue" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_catalogue" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_catalogue" TO "service_role";



GRANT SELECT ON TABLE "inventory"."stock_returns" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_returns" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_returns" TO "service_role";



GRANT SELECT ON TABLE "inventory"."stock_transfers" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_transfers" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."stock_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT SELECT ON TABLE "inventory"."transfers_in_transit" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."transfers_in_transit" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "inventory"."transfers_in_transit" TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."employee_schedule_assignments" TO "anon";
GRANT ALL ON TABLE "public"."employee_schedule_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_schedule_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_absence_view" TO "anon";
GRANT ALL ON TABLE "public"."attendance_absence_view" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_absence_view" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_absence_secure" TO "anon";
GRANT ALL ON TABLE "public"."attendance_absence_secure" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_absence_secure" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_daily_view" TO "anon";
GRANT ALL ON TABLE "public"."attendance_daily_view" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_daily_view" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_daily_secure" TO "anon";
GRANT ALL ON TABLE "public"."attendance_daily_secure" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_daily_secure" TO "service_role";



GRANT ALL ON TABLE "public"."bonus_policy" TO "anon";
GRANT ALL ON TABLE "public"."bonus_policy" TO "authenticated";
GRANT ALL ON TABLE "public"."bonus_policy" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_monthly_bonus" TO "anon";
GRANT ALL ON TABLE "public"."attendance_monthly_bonus" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_monthly_bonus" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_monthly_bonus_secure" TO "anon";
GRANT ALL ON TABLE "public"."attendance_monthly_bonus_secure" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_monthly_bonus_secure" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_weekly_summary" TO "anon";
GRANT ALL ON TABLE "public"."attendance_weekly_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_weekly_summary" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_weekly_secure" TO "anon";
GRANT ALL ON TABLE "public"."attendance_weekly_secure" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_weekly_secure" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."client_products" TO "anon";
GRANT ALL ON TABLE "public"."client_products" TO "authenticated";
GRANT ALL ON TABLE "public"."client_products" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."config_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."config_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."config_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."current_employee" TO "anon";
GRANT ALL ON TABLE "public"."current_employee" TO "authenticated";
GRANT ALL ON TABLE "public"."current_employee" TO "service_role";



GRANT ALL ON TABLE "public"."ecom_notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."ecom_notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ecom_notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ecom_order_items" TO "anon";
GRANT ALL ON TABLE "public"."ecom_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."ecom_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."ecom_orders" TO "anon";
GRANT ALL ON TABLE "public"."ecom_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."ecom_orders" TO "service_role";



GRANT ALL ON TABLE "public"."jubelio_invoices" TO "anon";
GRANT ALL ON TABLE "public"."jubelio_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."jubelio_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."jubelio_transactions" TO "anon";
GRANT ALL ON TABLE "public"."jubelio_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."jubelio_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."jubelio_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."jubelio_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."jubelio_webhook_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."jubelio_webhook_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jubelio_webhook_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jubelio_webhook_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_number_sequences" TO "anon";
GRANT ALL ON TABLE "public"."order_number_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."order_number_sequences" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."product_option_values" TO "anon";
GRANT ALL ON TABLE "public"."product_option_values" TO "authenticated";
GRANT ALL ON TABLE "public"."product_option_values" TO "service_role";



GRANT ALL ON TABLE "public"."product_options" TO "anon";
GRANT ALL ON TABLE "public"."product_options" TO "authenticated";
GRANT ALL ON TABLE "public"."product_options" TO "service_role";



GRANT ALL ON TABLE "public"."product_variant_option_values" TO "anon";
GRANT ALL ON TABLE "public"."product_variant_option_values" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variant_option_values" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































