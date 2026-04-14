export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string | null
          latitude: number | null
          longitude: number | null
          phone: string
          postal_code: string | null
          recipient_name: string
          user_id: string | null
        }
        Insert: {
          address_line: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone: string
          postal_code?: string | null
          recipient_name: string
          user_id?: string | null
        }
        Update: {
          address_line?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string
          postal_code?: string | null
          recipient_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          checkin_time: string
          created_at: string
          date: string
          employee_id: string
          id: string
          is_manual: boolean
          location_id: string
          schedule_id: string
          source: string
          telegram_user_id: number
          wifi_confirmed: boolean
        }
        Insert: {
          checkin_time: string
          created_at?: string
          date: string
          employee_id: string
          id?: string
          is_manual?: boolean
          location_id: string
          schedule_id: string
          source: string
          telegram_user_id: number
          wifi_confirmed: boolean
        }
        Update: {
          checkin_time?: string
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          is_manual?: boolean
          location_id?: string
          schedule_id?: string
          source?: string
          telegram_user_id?: number
          wifi_confirmed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_policy: {
        Row: {
          bonus_multiplier: number
          created_at: string
          created_by: string
          effective_from: string
          id: string
          max_late: number
        }
        Insert: {
          bonus_multiplier: number
          created_at?: string
          created_by: string
          effective_from: string
          id?: string
          max_late: number
        }
        Update: {
          bonus_multiplier?: number
          created_at?: string
          created_by?: string
          effective_from?: string
          id?: string
          max_late?: number
        }
        Relationships: [
          {
            foreignKeyName: "bonus_policy_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "current_employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_policy_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          quantity: number
          updated_at: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_products: {
        Row: {
          client_id: string
          created_at: string
          custom_price: number | null
          id: string
          min_qty: number | null
          product_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          custom_price?: number | null
          id?: string
          min_qty?: number | null
          product_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          custom_price?: number | null
          id?: string
          min_qty?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_name: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      config_audit_log: {
        Row: {
          action: string
          config_id: string
          config_type: string
          id: string
          performed_at: string
          performed_by: string
          snapshot: Json
        }
        Insert: {
          action: string
          config_id: string
          config_type: string
          id?: string
          performed_at?: string
          performed_by: string
          snapshot: Json
        }
        Update: {
          action?: string
          config_id?: string
          config_type?: string
          id?: string
          performed_at?: string
          performed_by?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "config_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "current_employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_notification_logs: {
        Row: {
          channel: string
          created_at: string | null
          error: string | null
          id: string
          message: string
          order_id: string | null
          order_number: string | null
          status: string
          type: string
        }
        Insert: {
          channel?: string
          created_at?: string | null
          error?: string | null
          id?: string
          message: string
          order_id?: string | null
          order_number?: string | null
          status: string
          type: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          error?: string | null
          id?: string
          message?: string
          order_id?: string | null
          order_number?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ecom_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_name: string
          quantity: number
          ship_weight_grams: number
          subtotal: number
          unit_price: number
          variant_description: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_name: string
          quantity: number
          ship_weight_grams: number
          subtotal: number
          unit_price: number
          variant_description: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_name?: string
          quantity?: number
          ship_weight_grams?: number
          subtotal?: number
          unit_price?: number
          variant_description?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecom_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ecom_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecom_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_orders: {
        Row: {
          biteship_order_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_status: string | null
          shipping_address: Json
          shipping_cost: number
          shipping_courier: string | null
          shipping_etd: string | null
          shipping_service: string | null
          status: string
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
          pivot_payment_session_id: string | null
          pivot_qr_url: string | null
          pivot_qr_string: string | null
          pivot_qr_expires_at: string | null
          xendit_invoice_id: string | null
          xendit_payment_method: string | null
        }
        Insert: {
          biteship_order_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_status?: string | null
          shipping_address: Json
          shipping_cost?: number
          shipping_courier?: string | null
          shipping_etd?: string | null
          shipping_service?: string | null
          status?: string
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          pivot_payment_session_id?: string | null
          pivot_qr_url?: string | null
          pivot_qr_string?: string | null
          pivot_qr_expires_at?: string | null
          xendit_invoice_id?: string | null
          xendit_payment_method?: string | null
        }
        Update: {
          biteship_order_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_status?: string | null
          shipping_address?: Json
          shipping_cost?: number
          shipping_courier?: string | null
          shipping_etd?: string | null
          shipping_service?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          pivot_payment_session_id?: string | null
          pivot_qr_url?: string | null
          pivot_qr_string?: string | null
          pivot_qr_expires_at?: string | null
          xendit_invoice_id?: string | null
          xendit_payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecom_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedule_assignments: {
        Row: {
          created_at: string
          day_of_week: number
          effective_from: string
          employee_id: string
          id: string
          schedule_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          effective_from: string
          employee_id: string
          id?: string
          schedule_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          effective_from?: string
          employee_id?: string
          id?: string
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedule_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "current_employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedule_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          telegram_user_id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          telegram_user_id: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          telegram_user_id?: number
        }
        Relationships: []
      }
      jubelio_invoices: {
        Row: {
          created_at: string | null
          customer_name: string | null
          doc_id: number
          doc_number: string | null
          doc_type: string | null
          due: number | null
          due_date: string | null
          grand_total: number | null
          report_date: string
          transaction_date: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          doc_id: number
          doc_number?: string | null
          doc_type?: string | null
          due?: number | null
          due_date?: string | null
          grand_total?: number | null
          report_date: string
          transaction_date?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          doc_id?: number
          doc_number?: string | null
          doc_type?: string | null
          due?: number | null
          due_date?: string | null
          grand_total?: number | null
          report_date?: string
          transaction_date?: string | null
        }
        Relationships: []
      }
      jubelio_transactions: {
        Row: {
          created_at: string | null
          customer_name: string | null
          doc_id: number
          doc_number: string | null
          doc_type: string | null
          due: number | null
          due_date: string | null
          grand_total: number | null
          report_date: string
          transaction_date: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          doc_id: number
          doc_number?: string | null
          doc_type?: string | null
          due?: number | null
          due_date?: string | null
          grand_total?: number | null
          report_date: string
          transaction_date?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          doc_id?: number
          doc_number?: string | null
          doc_type?: string | null
          due?: number | null
          due_date?: string | null
          grand_total?: number | null
          report_date?: string
          transaction_date?: string | null
        }
        Relationships: []
      }
      jubelio_webhook_events: {
        Row: {
          action: string | null
          event_type: string
          id: number
          payload: Json
          received_at: string | null
          ref_id: number | null
          ref_no: string | null
        }
        Insert: {
          action?: string | null
          event_type: string
          id?: number
          payload: Json
          received_at?: string | null
          ref_id?: number | null
          ref_no?: string | null
        }
        Update: {
          action?: string | null
          event_type?: string
          id?: number
          payload?: Json
          received_at?: string | null
          ref_id?: number | null
          ref_no?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          telegram_topic_id: number | null
          wifi_ssid: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          telegram_topic_id?: number | null
          wifi_ssid?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          telegram_topic_id?: number | null
          wifi_ssid?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          attempted_at: string
          channel: string
          error: string | null
          id: string
          order_id: string | null
          order_number: string
          status: string
        }
        Insert: {
          attempted_at?: string
          channel?: string
          error?: string | null
          id?: string
          order_id?: string | null
          order_number: string
          status: string
        }
        Update: {
          attempted_at?: string
          channel?: string
          error?: string | null
          id?: string
          order_id?: string | null
          order_number?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_number_sequences: {
        Row: {
          date_key: string
          last_seq: number
        }
        Insert: {
          date_key: string
          last_seq?: number
        }
        Update: {
          date_key?: string
          last_seq?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_notes: string | null
          client_id: string
          created_at: string
          id: string
          notes: string | null
          order_number: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          option_id: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          option_id?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          option_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_option_values: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_option_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          price: number
          product_id: string | null
          ship_weight_grams: number
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price: number
          product_id?: string | null
          ship_weight_grams: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          product_id?: string | null
          ship_weight_grams?: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_ids: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean
          is_global: boolean
          name: string
          short_description: string | null
          sku: string | null
          slug: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          category_ids?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          is_global?: boolean
          name: string
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          category_ids?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          is_global?: boolean
          name?: string
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          default_address_id: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_address_id?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_address_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_address_id_fkey"
            columns: ["default_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string
          effective_from: string
          grace_minutes: number
          id: string
          is_active: boolean | null
          location_id: string
          role: string
          shift_name: string
          start_time: string
        }
        Insert: {
          created_at?: string
          created_by: string
          effective_from: string
          grace_minutes?: number
          id?: string
          is_active?: boolean | null
          location_id: string
          role: string
          shift_name: string
          start_time: string
        }
        Update: {
          created_at?: string
          created_by?: string
          effective_from?: string
          grace_minutes?: number
          id?: string
          is_active?: boolean | null
          location_id?: string
          role?: string
          shift_name?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "current_employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dev_reset_today_attendance: { Args: never; Returns: undefined }
      ecom_decrement_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
      ecom_restore_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
