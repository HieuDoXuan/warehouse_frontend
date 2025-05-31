--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-05-26 11:30:22

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 16842)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5727 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 16658)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5728 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 329 (class 1255 OID 17689)
-- Name: gen_invoice_code(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gen_invoice_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    seq_num BIGINT;
BEGIN
    seq_num := nextval('seq_invoice_code');
    RETURN 'INV' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 8, '0');
END;
$$;


ALTER FUNCTION public.gen_invoice_code() OWNER TO postgres;

--
-- TOC entry 321 (class 1255 OID 16840)
-- Name: log_user_change_history(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_user_change_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.Username IS DISTINCT FROM OLD.Username THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'Username', OLD.Username, NEW.Username, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.PasswordHash IS DISTINCT FROM OLD.PasswordHash THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'PasswordHash', OLD.PasswordHash, NEW.PasswordHash, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.FullName IS DISTINCT FROM OLD.FullName THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'FullName', OLD.FullName, NEW.FullName, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.Email IS DISTINCT FROM OLD.Email THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'Email', OLD.Email, NEW.Email, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.PhoneNumber IS DISTINCT FROM OLD.PhoneNumber THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'PhoneNumber', OLD.PhoneNumber, NEW.PhoneNumber, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.Address IS DISTINCT FROM OLD.Address THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'Address', OLD.Address, NEW.Address, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.Status IS DISTINCT FROM OLD.Status THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'Status', OLD.Status, NEW.Status, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.AvatarUrl IS DISTINCT FROM OLD.AvatarUrl THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'AvatarUrl', OLD.AvatarUrl, NEW.AvatarUrl, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.DateOfBirth IS DISTINCT FROM OLD.DateOfBirth THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'DateOfBirth', OLD.DateOfBirth::TEXT, NEW.DateOfBirth::TEXT, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.Gender IS DISTINCT FROM OLD.Gender THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'Gender', OLD.Gender, NEW.Gender, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    IF NEW.DepartmentId IS DISTINCT FROM OLD.DepartmentId THEN
        INSERT INTO UserChangeHistory(UserId, ChangedField, OldValue, NewValue, ChangedAt, ChangedBy)
        VALUES (OLD.Id, 'DepartmentId', OLD.DepartmentId::TEXT, NEW.DepartmentId::TEXT, CURRENT_TIMESTAMP, NEW.UpdatedBy);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_user_change_history() OWNER TO postgres;

--
-- TOC entry 307 (class 1255 OID 17515)
-- Name: trg_calc_orderdetails_totalamount(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_calc_orderdetails_totalamount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.TotalAmount := (NEW.Quantity * NEW.Price) - NEW.Discount + ((NEW.Quantity * NEW.Price - NEW.Discount) * COALESCE(NEW.VAT,0)/100);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_calc_orderdetails_totalamount() OWNER TO postgres;

--
-- TOC entry 306 (class 1255 OID 17399)
-- Name: trg_check_approval_before_insert_inventorytransactions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_check_approval_before_insert_inventorytransactions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    need_approval_types CONSTANT TEXT[] := ARRAY['Export', 'TransferOut', 'Adjust']; -- Các loại cần phê duyệt
    is_need_approval BOOLEAN := NEW.TransactionType = ANY(need_approval_types);      -- Có cần phê duyệt không
    is_approved BOOLEAN;                                                            -- Đã duyệt chưa
BEGIN
    IF is_need_approval THEN
        -- Kiểm tra trạng thái phê duyệt trong bảng InventoryTransactionApprovals
        SELECT Approved INTO is_approved
        FROM InventoryTransactionApprovals
        WHERE TransactionType = NEW.TransactionType
          AND ReferenceCode = NEW.ReferenceCode
        LIMIT 1;

        IF is_approved IS DISTINCT FROM TRUE THEN
            RAISE EXCEPTION 'Giao dịch % với mã chứng từ % chưa được phê duyệt!', NEW.TransactionType, NEW.ReferenceCode;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_check_approval_before_insert_inventorytransactions() OWNER TO postgres;

--
-- TOC entry 316 (class 1255 OID 17401)
-- Name: trg_complete_transfer_request(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_complete_transfer_request() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    transfer_out_count INT;
    transfer_in_count INT;
BEGIN
    -- Chỉ kiểm tra với các giao dịch TransferOut hoặc TransferIn có ReferenceCode là mã yêu cầu chuyển kho
    IF NEW.TransactionType IN ('TransferOut', 'TransferIn') AND NEW.ReferenceCode IS NOT NULL THEN
        -- Đếm số giao dịch TransferOut đã ghi cho mã yêu cầu này
        SELECT COUNT(*) INTO transfer_out_count
        FROM InventoryTransactions
        WHERE TransactionType = 'TransferOut'
          AND ReferenceCode = NEW.ReferenceCode;

        -- Đếm số giao dịch TransferIn đã ghi cho mã yêu cầu này
        SELECT COUNT(*) INTO transfer_in_count
        FROM InventoryTransactions
        WHERE TransactionType = 'TransferIn'
          AND ReferenceCode = NEW.ReferenceCode;

        -- Nếu đã có cả TransferOut và TransferIn thì cập nhật trạng thái TransferRequests thành 'Completed'
        IF transfer_out_count > 0 AND transfer_in_count > 0 THEN
            UPDATE TransferRequests
            SET Status = 'Completed',
                CompletedAt = CURRENT_TIMESTAMP,
                CompletedBy = NEW.CreatedBy
            WHERE Id::text = NEW.ReferenceCode
              AND Status <> 'Completed';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_complete_transfer_request() OWNER TO postgres;

--
-- TOC entry 374 (class 1255 OID 17695)
-- Name: trg_create_invoice_when_order_completed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_create_invoice_when_order_completed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    invoice_exists INT;
    new_invoice_code TEXT;
BEGIN
    IF NEW.Status = 'Completed' THEN
        SELECT COUNT(*) INTO invoice_exists FROM Invoices WHERE OrderId = NEW.Id;
        IF invoice_exists = 0 THEN
            new_invoice_code := gen_invoice_code();
            INSERT INTO Invoices (InvoiceCode, OrderId, InvoiceDate, TotalAmount, Status, CreatedAt, CreatedBy)
            VALUES (
                new_invoice_code,                             -- Sinh mã hóa đơn tự động
                NEW.Id,                                       -- Đơn hàng liên kết
                CURRENT_TIMESTAMP,                            -- Ngày hóa đơn
                NEW.TotalAmount,                              -- Tổng tiền hóa đơn
                'Issued',                                     -- Trạng thái hóa đơn
                CURRENT_TIMESTAMP,                            -- Thời gian tạo
                NEW.UpdatedBy                                 -- Người tạo
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_create_invoice_when_order_completed() OWNER TO postgres;

--
-- TOC entry 371 (class 1255 OID 17021)
-- Name: trg_customerpointhistory_set_points(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_customerpointhistory_set_points() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_points INT;
BEGIN
    -- Lấy điểm hiện tại của khách hàng
    SELECT Points INTO current_points FROM Customers WHERE Id = NEW.CustomerId FOR UPDATE;

    -- Gán OldPoints là điểm hiện tại
    NEW.OldPoints := current_points;

    -- Tính NewPoints dựa vào loại thay đổi
    IF NEW.ChangeType = 'Cộng' THEN
        NEW.NewPoints := current_points + NEW.PointsChanged;
    ELSIF NEW.ChangeType = 'Trừ' THEN
        NEW.NewPoints := current_points - NEW.PointsChanged;
    ELSE
        RAISE EXCEPTION 'ChangeType không hợp lệ!';
    END IF;

    -- Cập nhật lại điểm cho khách hàng
    UPDATE Customers SET Points = NEW.NewPoints WHERE Id = NEW.CustomerId;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_customerpointhistory_set_points() OWNER TO postgres;

--
-- TOC entry 370 (class 1255 OID 17051)
-- Name: trg_exchange_points_for_voucher(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_exchange_points_for_voucher() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_points INT;
    percent NUMERIC(5,2);
BEGIN
    -- Lấy điểm hiện tại của khách hàng (OldPoints)
    SELECT Points INTO old_points FROM Customers WHERE Id = NEW.CustomerId FOR UPDATE;

    -- Tính phần trăm giảm giá dựa trên số điểm đổi (100 point = 1%)
    percent := NEW.PointsExchanged / 100.0;

    -- Kiểm tra đủ điểm không
    IF NEW.PointsExchanged > old_points THEN
        RAISE EXCEPTION 'Khách hàng không đủ điểm để đổi voucher!';
    END IF;

    -- Kiểm tra phần trăm giảm giá tối đa (ví dụ: 50%)
    IF percent > 50 THEN
        RAISE EXCEPTION 'Voucher không được vượt quá 50%% giá trị đơn hàng!';
    END IF;

    -- Gán DiscountPercent cho voucher
    NEW.DiscountPercent := percent;

    -- Tạo bản ghi lịch sử điểm (CustomerPointHistory), trigger trg_customerpointhistory_set_points sẽ tự trừ điểm
    INSERT INTO CustomerPointHistory (
        CustomerId, ChangeType, PointsChanged, Reason, CreatedAt, CreatedBy
    ) VALUES (
        NEW.CustomerId,
        'Trừ',
        NEW.PointsExchanged,
        'Đổi điểm lấy voucher ' || NEW.VoucherCode,
        CURRENT_TIMESTAMP,
        NEW.CreatedBy
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_exchange_points_for_voucher() OWNER TO postgres;

--
-- TOC entry 348 (class 1255 OID 17053)
-- Name: trg_expire_voucher(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_expire_voucher() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.ExpiredAt <= NOW() THEN
        NEW.Status := 'Expired';
    END IF;
    NEW.UpdatedAt := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_expire_voucher() OWNER TO postgres;

--
-- TOC entry 360 (class 1255 OID 17697)
-- Name: trg_log_order_status_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_log_order_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_note TEXT;
    v_details JSONB;
BEGIN
    -- Ghi chú tự động theo trạng thái mới
    v_note := 'Trạng thái đơn hàng chuyển từ "' || COALESCE(OLD.Status, '') || '" sang "' || COALESCE(NEW.Status, '') || '"';
    -- Thông tin chi tiết (có thể mở rộng thêm các trường khác nếu cần)
    v_details := jsonb_build_object(
        'OrderCode', NEW.OrderCode,
        'OldStatus', OLD.Status,
        'NewStatus', NEW.Status,
        'UpdatedBy', NEW.UpdatedBy,
        'UpdatedAt', NEW.UpdatedAt
    );

    IF NEW.Status IS DISTINCT FROM OLD.Status THEN
        INSERT INTO OrderLogs (
            OrderId, Action, OldStatus, NewStatus, Note, PerformedBy, LogTime, Details
        ) VALUES (
            NEW.Id,
            'StatusChanged',
            OLD.Status,
            NEW.Status,
            v_note,
            NEW.UpdatedBy,
            CURRENT_TIMESTAMP,
            v_details
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_log_order_status_change() OWNER TO postgres;

--
-- TOC entry 326 (class 1255 OID 17798)
-- Name: trg_log_report_summary(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_log_report_summary() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO ReportLogs (ReportId, Action, PerformedBy, Details)
        VALUES (
            NEW.Id, 'Created', NEW.CreatedBy,
            jsonb_build_object(
                'ReportType', NEW.ReportType,
                'ReportDate', NEW.ReportDate,
                'ReportPeriod', NEW.ReportPeriod,
                'Value', NEW.Value
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO ReportLogs (ReportId, Action, PerformedBy, Details)
        VALUES (
            NEW.Id, 'Updated', NEW.UpdatedBy,
            jsonb_build_object(
                'OldValue', OLD.Value,
                'NewValue', NEW.Value,
                'OldNote', OLD.Note,
                'NewNote', NEW.Note
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO ReportLogs (ReportId, Action, PerformedBy, Details)
        VALUES (
            OLD.Id, 'Deleted', OLD.UpdatedBy,
            jsonb_build_object(
                'ReportType', OLD.ReportType,
                'ReportDate', OLD.ReportDate,
                'ReportPeriod', OLD.ReportPeriod,
                'Value', OLD.Value,
                'Note', OLD.Note
            )
        );
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.trg_log_report_summary() OWNER TO postgres;

--
-- TOC entry 369 (class 1255 OID 17473)
-- Name: trg_only_one_main_supplier(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_only_one_main_supplier() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.IsMain THEN
        UPDATE ProductSuppliers
        SET IsMain = FALSE
        WHERE ProductId = NEW.ProductId AND Id <> NEW.Id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_only_one_main_supplier() OWNER TO postgres;

--
-- TOC entry 346 (class 1255 OID 17476)
-- Name: trg_productlots_inactive_when_empty(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_productlots_inactive_when_empty() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.Quantity = 0 AND NEW.Status <> 'Inactive' THEN
        NEW.Status := 'Inactive';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_productlots_inactive_when_empty() OWNER TO postgres;

--
-- TOC entry 305 (class 1255 OID 17692)
-- Name: trg_update_order_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_update_order_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    undelivered_count INT;
    delivered_ok INT;
    paid_amount NUMERIC(18,2);
    order_total NUMERIC(18,2);
BEGIN
    -- Đếm số giao hàng chưa Delivered và chưa Cancelled
    SELECT COUNT(*) INTO undelivered_count
    FROM Deliveries
    WHERE OrderId = NEW.OrderId AND Status NOT IN ('Delivered', 'Cancelled');

    -- Đếm số giao hàng đã Delivered
    SELECT COUNT(*) INTO delivered_ok
    FROM Deliveries
    WHERE OrderId = NEW.OrderId AND Status = 'Delivered';

    -- Tổng tiền đã thanh toán
    SELECT COALESCE(SUM(Amount),0) INTO paid_amount
    FROM Payments
    WHERE OrderId = NEW.OrderId AND Status = 'Completed';

    -- Tổng tiền đơn hàng
    SELECT TotalAmount INTO order_total
    FROM Orders
    WHERE Id = NEW.OrderId;

    -- Nếu tất cả giao hàng đều Delivered (hoặc Cancelled) và có ít nhất 1 giao hàng Delivered, đồng thời thanh toán đủ
    IF undelivered_count = 0 AND delivered_ok > 0 AND paid_amount >= order_total THEN
        UPDATE Orders
        SET Status = 'Completed',
            UpdatedAt = CURRENT_TIMESTAMP
        WHERE Id = NEW.OrderId AND Status <> 'Completed';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.trg_update_order_status() OWNER TO postgres;

--
-- TOC entry 312 (class 1255 OID 17517)
-- Name: trg_update_orders_totalamount(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_update_orders_totalamount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Orders
    SET TotalAmount = (
        SELECT COALESCE(SUM(TotalAmount),0)
        FROM OrderDetails
        WHERE OrderId = NEW.OrderId
          AND Status = 'Active'
    )
    WHERE Id = NEW.OrderId;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.trg_update_orders_totalamount() OWNER TO postgres;

--
-- TOC entry 354 (class 1255 OID 17795)
-- Name: trg_update_updatedat_report(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_update_updatedat_report() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UpdatedAt := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_update_updatedat_report() OWNER TO postgres;

--
-- TOC entry 366 (class 1255 OID 16835)
-- Name: update_updatedat_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updatedat_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.UpdatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updatedat_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 294 (class 1259 OID 17721)
-- Name: allowedmetrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allowedmetrics (
    reftype character varying(30) NOT NULL,
    metrictype character varying(20) NOT NULL
);


ALTER TABLE public.allowedmetrics OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 17607)
-- Name: approvalflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approvalflows (
    id integer NOT NULL,
    flowname character varying(100) NOT NULL,
    ordertype character varying(20) NOT NULL,
    steporder integer NOT NULL,
    rolename character varying(50) NOT NULL,
    isfinalstep boolean DEFAULT false,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT approvalflows_ordertype_check CHECK (((ordertype)::text = ANY ((ARRAY['Sale'::character varying, 'Purchase'::character varying, 'Internal'::character varying])::text[]))),
    CONSTRAINT approvalflows_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.approvalflows OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 17606)
-- Name: approvalflows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approvalflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approvalflows_id_seq OWNER TO postgres;

--
-- TOC entry 5729 (class 0 OID 0)
-- Dependencies: 283
-- Name: approvalflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approvalflows_id_seq OWNED BY public.approvalflows.id;


--
-- TOC entry 234 (class 1259 OID 16942)
-- Name: customerlevels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customerlevels (
    id integer NOT NULL,
    levelname character varying(20) NOT NULL,
    description text,
    discountpercent numeric(5,2) DEFAULT 0,
    otherbenefits text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT customerlevels_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.customerlevels OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16941)
-- Name: customerlevels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customerlevels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customerlevels_id_seq OWNER TO postgres;

--
-- TOC entry 5730 (class 0 OID 0)
-- Dependencies: 233
-- Name: customerlevels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customerlevels_id_seq OWNED BY public.customerlevels.id;


--
-- TOC entry 238 (class 1259 OID 16972)
-- Name: customerpointhistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customerpointhistory (
    id integer NOT NULL,
    customerid integer,
    changetype character varying(20) NOT NULL,
    pointschanged integer NOT NULL,
    oldpoints integer NOT NULL,
    newpoints integer NOT NULL,
    reason text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    createdby uuid,
    CONSTRAINT chk_customerpointhistory_pointschanged_nonnegative CHECK ((pointschanged >= 0)),
    CONSTRAINT customerpointhistory_changetype_check CHECK (((changetype)::text = ANY ((ARRAY['Cộng'::character varying, 'Trừ'::character varying])::text[])))
);


ALTER TABLE public.customerpointhistory OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16971)
-- Name: customerpointhistory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customerpointhistory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customerpointhistory_id_seq OWNER TO postgres;

--
-- TOC entry 5731 (class 0 OID 0)
-- Dependencies: 237
-- Name: customerpointhistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customerpointhistory_id_seq OWNED BY public.customerpointhistory.id;


--
-- TOC entry 236 (class 1259 OID 16957)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    customercode character varying(20) NOT NULL,
    customername character varying(100) NOT NULL,
    contactname character varying(100),
    phonenumber character varying(20),
    email character varying(100),
    address character varying(255),
    taxcode character varying(50),
    note text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    customerlevelid integer,
    points integer DEFAULT 0,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT customers_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16956)
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- TOC entry 5732 (class 0 OID 0)
-- Dependencies: 235
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 280 (class 1259 OID 17555)
-- Name: deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deliveries (
    id integer NOT NULL,
    orderid integer NOT NULL,
    deliverycode character varying(30) NOT NULL,
    deliverydate timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    shippername character varying(100),
    deliveryaddress character varying(255),
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    shippingproviderid integer,
    trackingnumber character varying(50),
    shippingfee numeric(18,2),
    trackingurl character varying(255),
    syncstatus character varying(20) DEFAULT 'None'::character varying,
    synclog text,
    CONSTRAINT deliveries_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Delivering'::character varying, 'Delivered'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT deliveries_syncstatus_check CHECK (((syncstatus)::text = ANY ((ARRAY['None'::character varying, 'Synced'::character varying, 'Error'::character varying])::text[])))
);


ALTER TABLE public.deliveries OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 17554)
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deliveries_id_seq OWNER TO postgres;

--
-- TOC entry 5733 (class 0 OID 0)
-- Dependencies: 279
-- Name: deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deliveries_id_seq OWNED BY public.deliveries.id;


--
-- TOC entry 221 (class 1259 OID 16691)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    departmentcode character varying(20) NOT NULL,
    departmentname character varying(100) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    CONSTRAINT departments_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16690)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- TOC entry 5734 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 266 (class 1259 OID 17388)
-- Name: inventorytransactionapprovals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventorytransactionapprovals (
    id integer NOT NULL,
    transactiontype character varying(20) NOT NULL,
    referencecode character varying(50) NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    approvedat timestamp without time zone,
    approvedby uuid,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    createdby uuid
);


ALTER TABLE public.inventorytransactionapprovals OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 17387)
-- Name: inventorytransactionapprovals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventorytransactionapprovals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventorytransactionapprovals_id_seq OWNER TO postgres;

--
-- TOC entry 5735 (class 0 OID 0)
-- Dependencies: 265
-- Name: inventorytransactionapprovals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventorytransactionapprovals_id_seq OWNED BY public.inventorytransactionapprovals.id;


--
-- TOC entry 260 (class 1259 OID 17293)
-- Name: inventorytransactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventorytransactions (
    id integer NOT NULL,
    productid integer NOT NULL,
    warehouseid integer NOT NULL,
    transactiontype character varying(20) NOT NULL,
    quantity integer NOT NULL,
    unitid integer NOT NULL,
    price numeric(18,2),
    referencecode character varying(50),
    description text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    createdby uuid,
    CONSTRAINT inventorytransactions_transactiontype_check CHECK (((transactiontype)::text = ANY ((ARRAY['Import'::character varying, 'Export'::character varying, 'TransferIn'::character varying, 'TransferOut'::character varying, 'Adjust'::character varying, 'Opening'::character varying])::text[])))
);


ALTER TABLE public.inventorytransactions OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 17292)
-- Name: inventorytransactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventorytransactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventorytransactions_id_seq OWNER TO postgres;

--
-- TOC entry 5736 (class 0 OID 0)
-- Dependencies: 259
-- Name: inventorytransactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventorytransactions_id_seq OWNED BY public.inventorytransactions.id;


--
-- TOC entry 289 (class 1259 OID 17649)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoicecode character varying(40) NOT NULL,
    orderid integer NOT NULL,
    invoicedate timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    totalamount numeric(18,2) NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    fileurl character varying(255),
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Issued'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 17648)
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- TOC entry 5737 (class 0 OID 0)
-- Dependencies: 288
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- TOC entry 293 (class 1259 OID 17714)
-- Name: metrictypes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metrictypes (
    metrictype character varying(20) NOT NULL,
    description text
);


ALTER TABLE public.metrictypes OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 17623)
-- Name: orderapprovals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orderapprovals (
    id integer NOT NULL,
    orderid integer NOT NULL,
    flowid integer,
    approvalstep character varying(50) NOT NULL,
    steporder integer,
    rolename character varying(50),
    approved boolean DEFAULT false NOT NULL,
    approvedat timestamp without time zone,
    approvedby uuid,
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    createdby uuid
);


ALTER TABLE public.orderapprovals OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 17622)
-- Name: orderapprovals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orderapprovals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orderapprovals_id_seq OWNER TO postgres;

--
-- TOC entry 5738 (class 0 OID 0)
-- Dependencies: 285
-- Name: orderapprovals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orderapprovals_id_seq OWNED BY public.orderapprovals.id;


--
-- TOC entry 276 (class 1259 OID 17498)
-- Name: orderdetails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orderdetails (
    id integer NOT NULL,
    orderid integer NOT NULL,
    productid integer NOT NULL,
    unitid integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(18,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    vat numeric(5,2) DEFAULT 0,
    totalamount numeric(18,2),
    note text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT orderdetails_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.orderdetails OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 17497)
-- Name: orderdetails_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orderdetails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orderdetails_id_seq OWNER TO postgres;

--
-- TOC entry 5739 (class 0 OID 0)
-- Dependencies: 275
-- Name: orderdetails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orderdetails_id_seq OWNED BY public.orderdetails.id;


--
-- TOC entry 291 (class 1259 OID 17673)
-- Name: orderlogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orderlogs (
    id integer NOT NULL,
    orderid integer NOT NULL,
    logtime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    action character varying(50) NOT NULL,
    oldstatus character varying(20),
    newstatus character varying(20),
    note text,
    performedby uuid,
    details jsonb
);


ALTER TABLE public.orderlogs OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 17672)
-- Name: orderlogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orderlogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orderlogs_id_seq OWNER TO postgres;

--
-- TOC entry 5740 (class 0 OID 0)
-- Dependencies: 290
-- Name: orderlogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orderlogs_id_seq OWNED BY public.orderlogs.id;


--
-- TOC entry 274 (class 1259 OID 17479)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    ordercode character varying(30) NOT NULL,
    orderdate timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    customerid integer,
    supplierid integer,
    ordertype character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'Draft'::character varying NOT NULL,
    totalamount numeric(18,2),
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT orders_ordertype_check CHECK (((ordertype)::text = ANY ((ARRAY['Sale'::character varying, 'Purchase'::character varying, 'Internal'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Confirmed'::character varying, 'Approved'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 17478)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- TOC entry 5741 (class 0 OID 0)
-- Dependencies: 273
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 282 (class 1259 OID 17585)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    orderid integer NOT NULL,
    paymentcode character varying(30) NOT NULL,
    paymentdate timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    amount numeric(18,2) NOT NULL,
    paymentmethod character varying(50),
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 17584)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- TOC entry 5742 (class 0 OID 0)
-- Dependencies: 281
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 225 (class 1259 OID 16717)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    CONSTRAINT permissions_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16716)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- TOC entry 5743 (class 0 OID 0)
-- Dependencies: 224
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 246 (class 1259 OID 17119)
-- Name: productcategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productcategories (
    id integer NOT NULL,
    categorycode character varying(20) NOT NULL,
    categoryname character varying(100) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT productcategories_categorycode_check CHECK (((categorycode)::text ~ '^[A-Z0-9_]{3,20}$'::text)),
    CONSTRAINT productcategories_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.productcategories OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 17118)
-- Name: productcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productcategories_id_seq OWNER TO postgres;

--
-- TOC entry 5744 (class 0 OID 0)
-- Dependencies: 245
-- Name: productcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productcategories_id_seq OWNED BY public.productcategories.id;


--
-- TOC entry 254 (class 1259 OID 17241)
-- Name: productimages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productimages (
    id integer NOT NULL,
    productid integer NOT NULL,
    imageurl character varying(255) NOT NULL,
    description text,
    ismain boolean DEFAULT false,
    sortorder integer DEFAULT 0,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT productimages_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.productimages OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 17240)
-- Name: productimages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productimages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productimages_id_seq OWNER TO postgres;

--
-- TOC entry 5745 (class 0 OID 0)
-- Dependencies: 253
-- Name: productimages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productimages_id_seq OWNED BY public.productimages.id;


--
-- TOC entry 272 (class 1259 OID 17432)
-- Name: productlots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productlots (
    id integer NOT NULL,
    productid integer NOT NULL,
    lotnumber character varying(50) NOT NULL,
    manufacturedate date,
    expirydate date,
    quantity integer NOT NULL,
    warehouseid integer,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT productlots_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.productlots OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 17431)
-- Name: productlots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productlots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productlots_id_seq OWNER TO postgres;

--
-- TOC entry 5746 (class 0 OID 0)
-- Dependencies: 271
-- Name: productlots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productlots_id_seq OWNED BY public.productlots.id;


--
-- TOC entry 270 (class 1259 OID 17419)
-- Name: productprices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productprices (
    id integer NOT NULL,
    productid integer NOT NULL,
    pricetype character varying(20) NOT NULL,
    price numeric(18,2) NOT NULL,
    effectivefrom timestamp without time zone NOT NULL,
    effectiveto timestamp without time zone,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    createdby uuid,
    CONSTRAINT productprices_pricetype_check CHECK (((pricetype)::text = ANY ((ARRAY['Cost'::character varying, 'Sale'::character varying])::text[]))),
    CONSTRAINT productprices_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.productprices OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 17418)
-- Name: productprices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productprices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productprices_id_seq OWNER TO postgres;

--
-- TOC entry 5747 (class 0 OID 0)
-- Dependencies: 269
-- Name: productprices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productprices_id_seq OWNED BY public.productprices.id;


--
-- TOC entry 252 (class 1259 OID 17181)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    productcode character varying(30) NOT NULL,
    productname character varying(100) NOT NULL,
    categoryid integer,
    baseunitid integer,
    brand character varying(50),
    origin character varying(100),
    barcode character varying(50),
    imageurl character varying(255),
    description text,
    costprice numeric(18,2),
    saleprice numeric(18,2),
    vat numeric(5,2),
    minstock integer DEFAULT 0,
    maxstock integer,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT products_productcode_check CHECK (((productcode)::text ~ '^[A-Z0-9_]{3,30}$'::text)),
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17180)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 5748 (class 0 OID 0)
-- Dependencies: 251
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 258 (class 1259 OID 17278)
-- Name: productstocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productstocks (
    id integer NOT NULL,
    productid integer NOT NULL,
    warehouseid integer NOT NULL,
    quantity integer DEFAULT 0,
    minstock integer DEFAULT 0,
    maxstock integer,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    updatedat timestamp without time zone,
    updatedby uuid,
    CONSTRAINT productstocks_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.productstocks OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 17277)
-- Name: productstocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productstocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productstocks_id_seq OWNER TO postgres;

--
-- TOC entry 5749 (class 0 OID 0)
-- Dependencies: 257
-- Name: productstocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productstocks_id_seq OWNED BY public.productstocks.id;


--
-- TOC entry 268 (class 1259 OID 17404)
-- Name: productsuppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productsuppliers (
    id integer NOT NULL,
    productid integer NOT NULL,
    supplierid integer NOT NULL,
    supplierproductcode character varying(50),
    ismain boolean DEFAULT false,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT productsuppliers_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.productsuppliers OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 17403)
-- Name: productsuppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productsuppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productsuppliers_id_seq OWNER TO postgres;

--
-- TOC entry 5750 (class 0 OID 0)
-- Dependencies: 267
-- Name: productsuppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productsuppliers_id_seq OWNED BY public.productsuppliers.id;


--
-- TOC entry 298 (class 1259 OID 17752)
-- Name: reportdetails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportdetails (
    id integer NOT NULL,
    reportid integer NOT NULL,
    reftype character varying(30) NOT NULL,
    refid integer,
    metrictype character varying(20) NOT NULL,
    value numeric(18,2),
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid
);


ALTER TABLE public.reportdetails OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 17751)
-- Name: reportdetails_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reportdetails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reportdetails_id_seq OWNER TO postgres;

--
-- TOC entry 5751 (class 0 OID 0)
-- Dependencies: 297
-- Name: reportdetails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reportdetails_id_seq OWNED BY public.reportdetails.id;


--
-- TOC entry 300 (class 1259 OID 17785)
-- Name: reportlogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportlogs (
    id integer NOT NULL,
    reportid integer,
    action character varying(20) NOT NULL,
    logtime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    performedby uuid,
    details jsonb
);


ALTER TABLE public.reportlogs OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 17784)
-- Name: reportlogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reportlogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reportlogs_id_seq OWNER TO postgres;

--
-- TOC entry 5752 (class 0 OID 0)
-- Dependencies: 299
-- Name: reportlogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reportlogs_id_seq OWNED BY public.reportlogs.id;


--
-- TOC entry 292 (class 1259 OID 17707)
-- Name: reportreftypes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportreftypes (
    reftype character varying(30) NOT NULL,
    description text
);


ALTER TABLE public.reportreftypes OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 17737)
-- Name: reportsummaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportsummaries (
    id integer NOT NULL,
    reportdate date NOT NULL,
    reporttype character varying(50) NOT NULL,
    reportperiod character varying(20) DEFAULT 'daily'::character varying NOT NULL,
    value numeric(18,2),
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT reportsummaries_reportperiod_check CHECK (((reportperiod)::text = ANY ((ARRAY['daily'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[])))
);


ALTER TABLE public.reportsummaries OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 17736)
-- Name: reportsummaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reportsummaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reportsummaries_id_seq OWNER TO postgres;

--
-- TOC entry 5753 (class 0 OID 0)
-- Dependencies: 295
-- Name: reportsummaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reportsummaries_id_seq OWNED BY public.reportsummaries.id;


--
-- TOC entry 227 (class 1259 OID 16743)
-- Name: rolepermissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rolepermissions (
    roleid integer NOT NULL,
    permissionid integer NOT NULL
);


ALTER TABLE public.rolepermissions OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16705)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    CONSTRAINT roles_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16704)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5754 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 287 (class 1259 OID 17647)
-- Name: seq_invoice_code; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_invoice_code
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_invoice_code OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 17540)
-- Name: shippingproviders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shippingproviders (
    id integer NOT NULL,
    providercode character varying(30) NOT NULL,
    providername character varying(100) NOT NULL,
    contactname character varying(100),
    phonenumber character varying(20),
    email character varying(100),
    website character varying(100),
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    note text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT shippingproviders_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.shippingproviders OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 17539)
-- Name: shippingproviders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shippingproviders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shippingproviders_id_seq OWNER TO postgres;

--
-- TOC entry 5755 (class 0 OID 0)
-- Dependencies: 277
-- Name: shippingproviders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shippingproviders_id_seq OWNED BY public.shippingproviders.id;


--
-- TOC entry 262 (class 1259 OID 17307)
-- Name: stockadjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stockadjustments (
    id integer NOT NULL,
    productid integer NOT NULL,
    warehouseid integer NOT NULL,
    oldquantity integer NOT NULL,
    newquantity integer NOT NULL,
    reason text,
    adjustmentdate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    createdby uuid
);


ALTER TABLE public.stockadjustments OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 17306)
-- Name: stockadjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stockadjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stockadjustments_id_seq OWNER TO postgres;

--
-- TOC entry 5756 (class 0 OID 0)
-- Dependencies: 261
-- Name: stockadjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stockadjustments_id_seq OWNED BY public.stockadjustments.id;


--
-- TOC entry 242 (class 1259 OID 17056)
-- Name: suppliercategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliercategories (
    id integer NOT NULL,
    categoryname character varying(50) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT suppliercategories_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.suppliercategories OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17055)
-- Name: suppliercategories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliercategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliercategories_id_seq OWNER TO postgres;

--
-- TOC entry 5757 (class 0 OID 0)
-- Dependencies: 241
-- Name: suppliercategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliercategories_id_seq OWNED BY public.suppliercategories.id;


--
-- TOC entry 244 (class 1259 OID 17081)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    suppliercode character varying(20) NOT NULL,
    suppliername character varying(100) NOT NULL,
    contactname character varying(100),
    phonenumber character varying(20),
    email character varying(100),
    address character varying(255),
    country character varying(50),
    region character varying(50),
    taxcode character varying(50),
    bankaccount character varying(50),
    bankname character varying(100),
    website character varying(100),
    note text,
    categoryid integer,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT suppliers_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT suppliers_phonenumber_check CHECK (((phonenumber)::text ~ '^[0-9\+\-\s]{8,20}$'::text)),
    CONSTRAINT suppliers_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[]))),
    CONSTRAINT suppliers_taxcode_check CHECK (((taxcode)::text ~ '^[0-9A-Za-z\-]{8,20}$'::text))
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17080)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- TOC entry 5758 (class 0 OID 0)
-- Dependencies: 243
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- TOC entry 264 (class 1259 OID 17319)
-- Name: transferrequests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transferrequests (
    id integer NOT NULL,
    productid integer NOT NULL,
    fromwarehouseid integer NOT NULL,
    towarehouseid integer NOT NULL,
    quantity integer NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    requestedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approvedat timestamp without time zone,
    completedat timestamp without time zone,
    requestedby uuid,
    approvedby uuid,
    completedby uuid,
    note text,
    CONSTRAINT transferrequests_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.transferrequests OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 17318)
-- Name: transferrequests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transferrequests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transferrequests_id_seq OWNER TO postgres;

--
-- TOC entry 5759 (class 0 OID 0)
-- Dependencies: 263
-- Name: transferrequests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transferrequests_id_seq OWNED BY public.transferrequests.id;


--
-- TOC entry 250 (class 1259 OID 17167)
-- Name: unitconversions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unitconversions (
    id integer NOT NULL,
    fromunitid integer,
    tounitid integer,
    conversionrate numeric(12,6) NOT NULL,
    description text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid
);


ALTER TABLE public.unitconversions OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 17166)
-- Name: unitconversions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unitconversions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unitconversions_id_seq OWNER TO postgres;

--
-- TOC entry 5760 (class 0 OID 0)
-- Dependencies: 249
-- Name: unitconversions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unitconversions_id_seq OWNED BY public.unitconversions.id;


--
-- TOC entry 248 (class 1259 OID 17148)
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id integer NOT NULL,
    unitcode character varying(20) NOT NULL,
    unitname character varying(50) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT units_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[]))),
    CONSTRAINT units_unitcode_check CHECK (((unitcode)::text ~ '^[A-Z0-9_]{2,20}$'::text))
);


ALTER TABLE public.units OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 17147)
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_id_seq OWNER TO postgres;

--
-- TOC entry 5761 (class 0 OID 0)
-- Dependencies: 247
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- TOC entry 230 (class 1259 OID 16774)
-- Name: useractivitylogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.useractivitylogs (
    id integer NOT NULL,
    userid uuid,
    activitytype character varying(20) NOT NULL,
    tablename character varying(50) NOT NULL,
    recordid text,
    description text,
    olddata jsonb,
    newdata jsonb,
    issuccess boolean DEFAULT true,
    activitytime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ipaddress character varying(45),
    CONSTRAINT useractivitylogs_activitytype_check CHECK (((activitytype)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'LOGIN'::character varying, 'LOGOUT'::character varying, 'ACCESS'::character varying, 'FAILED_LOGIN'::character varying, 'EXPORT'::character varying, 'IMPORT'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE public.useractivitylogs OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16773)
-- Name: useractivitylogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.useractivitylogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.useractivitylogs_id_seq OWNER TO postgres;

--
-- TOC entry 5762 (class 0 OID 0)
-- Dependencies: 229
-- Name: useractivitylogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.useractivitylogs_id_seq OWNED BY public.useractivitylogs.id;


--
-- TOC entry 232 (class 1259 OID 16786)
-- Name: userchangehistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userchangehistory (
    id integer NOT NULL,
    userid uuid,
    changedfield character varying(50) NOT NULL,
    oldvalue text,
    newvalue text,
    changedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    changedby uuid
);


ALTER TABLE public.userchangehistory OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16785)
-- Name: userchangehistory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.userchangehistory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.userchangehistory_id_seq OWNER TO postgres;

--
-- TOC entry 5763 (class 0 OID 0)
-- Dependencies: 231
-- Name: userchangehistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.userchangehistory_id_seq OWNED BY public.userchangehistory.id;


--
-- TOC entry 228 (class 1259 OID 16758)
-- Name: userpermissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userpermissions (
    userid uuid NOT NULL,
    permissionid integer NOT NULL
);


ALTER TABLE public.userpermissions OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16728)
-- Name: userroles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userroles (
    userid uuid NOT NULL,
    roleid integer NOT NULL
);


ALTER TABLE public.userroles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16669)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usercode character varying(20) NOT NULL,
    username character varying(50) NOT NULL,
    passwordhash character varying(255) NOT NULL,
    fullname character varying(100),
    email character varying(100) NOT NULL,
    phonenumber character varying(20),
    address character varying(255),
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    avatarurl character varying(255),
    dateofbirth date,
    gender character varying(10) NOT NULL,
    lastloginat timestamp without time zone,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    departmentid integer,
    updatedby uuid,
    CONSTRAINT users_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 17025)
-- Name: vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vouchers (
    id integer NOT NULL,
    vouchercode character varying(30) NOT NULL,
    customerid integer,
    discountpercent numeric(5,2) NOT NULL,
    pointsexchanged integer NOT NULL,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    expiredat timestamp without time zone NOT NULL,
    usedat timestamp without time zone,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT vouchers_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Used'::character varying, 'Expired'::character varying])::text[])))
);


ALTER TABLE public.vouchers OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 17024)
-- Name: vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vouchers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vouchers_id_seq OWNER TO postgres;

--
-- TOC entry 5764 (class 0 OID 0)
-- Dependencies: 239
-- Name: vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vouchers_id_seq OWNED BY public.vouchers.id;


--
-- TOC entry 256 (class 1259 OID 17262)
-- Name: warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    warehousecode character varying(20) NOT NULL,
    warehousename character varying(100) NOT NULL,
    address character varying(255),
    description text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone,
    createdby uuid,
    updatedby uuid,
    CONSTRAINT warehouses_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.warehouses OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 17261)
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO postgres;

--
-- TOC entry 5765 (class 0 OID 0)
-- Dependencies: 255
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- TOC entry 5117 (class 2604 OID 17610)
-- Name: approvalflows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approvalflows ALTER COLUMN id SET DEFAULT nextval('public.approvalflows_id_seq'::regclass);


--
-- TOC entry 5033 (class 2604 OID 16945)
-- Name: customerlevels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerlevels ALTER COLUMN id SET DEFAULT nextval('public.customerlevels_id_seq'::regclass);


--
-- TOC entry 5041 (class 2604 OID 16975)
-- Name: customerpointhistory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerpointhistory ALTER COLUMN id SET DEFAULT nextval('public.customerpointhistory_id_seq'::regclass);


--
-- TOC entry 5037 (class 2604 OID 16960)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 5108 (class 2604 OID 17558)
-- Name: deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries ALTER COLUMN id SET DEFAULT nextval('public.deliveries_id_seq'::regclass);


--
-- TOC entry 5019 (class 2604 OID 16694)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 5083 (class 2604 OID 17391)
-- Name: inventorytransactionapprovals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventorytransactionapprovals ALTER COLUMN id SET DEFAULT nextval('public.inventorytransactionapprovals_id_seq'::regclass);


--
-- TOC entry 5076 (class 2604 OID 17296)
-- Name: inventorytransactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventorytransactions ALTER COLUMN id SET DEFAULT nextval('public.inventorytransactions_id_seq'::regclass);


--
-- TOC entry 5124 (class 2604 OID 17652)
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- TOC entry 5121 (class 2604 OID 17626)
-- Name: orderapprovals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderapprovals ALTER COLUMN id SET DEFAULT nextval('public.orderapprovals_id_seq'::regclass);


--
-- TOC entry 5100 (class 2604 OID 17501)
-- Name: orderdetails id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderdetails ALTER COLUMN id SET DEFAULT nextval('public.orderdetails_id_seq'::regclass);


--
-- TOC entry 5128 (class 2604 OID 17676)
-- Name: orderlogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderlogs ALTER COLUMN id SET DEFAULT nextval('public.orderlogs_id_seq'::regclass);


--
-- TOC entry 5096 (class 2604 OID 17482)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 5113 (class 2604 OID 17588)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 5025 (class 2604 OID 16720)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 5052 (class 2604 OID 17122)
-- Name: productcategories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcategories ALTER COLUMN id SET DEFAULT nextval('public.productcategories_id_seq'::regclass);


--
-- TOC entry 5064 (class 2604 OID 17244)
-- Name: productimages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages ALTER COLUMN id SET DEFAULT nextval('public.productimages_id_seq'::regclass);


--
-- TOC entry 5093 (class 2604 OID 17435)
-- Name: productlots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productlots ALTER COLUMN id SET DEFAULT nextval('public.productlots_id_seq'::regclass);


--
-- TOC entry 5090 (class 2604 OID 17422)
-- Name: productprices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productprices ALTER COLUMN id SET DEFAULT nextval('public.productprices_id_seq'::regclass);


--
-- TOC entry 5060 (class 2604 OID 17184)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 5072 (class 2604 OID 17281)
-- Name: productstocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productstocks ALTER COLUMN id SET DEFAULT nextval('public.productstocks_id_seq'::regclass);


--
-- TOC entry 5086 (class 2604 OID 17407)
-- Name: productsuppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsuppliers ALTER COLUMN id SET DEFAULT nextval('public.productsuppliers_id_seq'::regclass);


--
-- TOC entry 5133 (class 2604 OID 17755)
-- Name: reportdetails id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportdetails ALTER COLUMN id SET DEFAULT nextval('public.reportdetails_id_seq'::regclass);


--
-- TOC entry 5135 (class 2604 OID 17788)
-- Name: reportlogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportlogs ALTER COLUMN id SET DEFAULT nextval('public.reportlogs_id_seq'::regclass);


--
-- TOC entry 5130 (class 2604 OID 17740)
-- Name: reportsummaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportsummaries ALTER COLUMN id SET DEFAULT nextval('public.reportsummaries_id_seq'::regclass);


--
-- TOC entry 5022 (class 2604 OID 16708)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 5105 (class 2604 OID 17543)
-- Name: shippingproviders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shippingproviders ALTER COLUMN id SET DEFAULT nextval('public.shippingproviders_id_seq'::regclass);


--
-- TOC entry 5078 (class 2604 OID 17310)
-- Name: stockadjustments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stockadjustments ALTER COLUMN id SET DEFAULT nextval('public.stockadjustments_id_seq'::regclass);


--
-- TOC entry 5046 (class 2604 OID 17059)
-- Name: suppliercategories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliercategories ALTER COLUMN id SET DEFAULT nextval('public.suppliercategories_id_seq'::regclass);


--
-- TOC entry 5049 (class 2604 OID 17084)
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 5080 (class 2604 OID 17322)
-- Name: transferrequests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferrequests ALTER COLUMN id SET DEFAULT nextval('public.transferrequests_id_seq'::regclass);


--
-- TOC entry 5058 (class 2604 OID 17170)
-- Name: unitconversions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unitconversions ALTER COLUMN id SET DEFAULT nextval('public.unitconversions_id_seq'::regclass);


--
-- TOC entry 5055 (class 2604 OID 17151)
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- TOC entry 5028 (class 2604 OID 16777)
-- Name: useractivitylogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useractivitylogs ALTER COLUMN id SET DEFAULT nextval('public.useractivitylogs_id_seq'::regclass);


--
-- TOC entry 5031 (class 2604 OID 16789)
-- Name: userchangehistory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userchangehistory ALTER COLUMN id SET DEFAULT nextval('public.userchangehistory_id_seq'::regclass);


--
-- TOC entry 5043 (class 2604 OID 17028)
-- Name: vouchers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers ALTER COLUMN id SET DEFAULT nextval('public.vouchers_id_seq'::regclass);


--
-- TOC entry 5069 (class 2604 OID 17265)
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- TOC entry 5715 (class 0 OID 17721)
-- Dependencies: 294
-- Data for Name: allowedmetrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.allowedmetrics (reftype, metrictype) FROM stdin;
Product	Revenue
Product	Quantity
Order	Revenue
Order	Discount
Customer	Revenue
Customer	Quantity
\.


--
-- TOC entry 5705 (class 0 OID 17607)
-- Dependencies: 284
-- Data for Name: approvalflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approvalflows (id, flowname, ordertype, steporder, rolename, isfinalstep, status, note, createdat, updatedat, createdby, updatedby) FROM stdin;
1	Flow bán hàng chuẩn	Sale	1	Manager	f	Active	Trưởng phòng duyệt	2025-05-26 10:42:24.652977	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	Flow bán hàng chuẩn	Sale	2	Accountant	t	Active	Kế toán duyệt	2025-05-26 10:42:24.652977	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5655 (class 0 OID 16942)
-- Dependencies: 234
-- Data for Name: customerlevels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customerlevels (id, levelname, description, discountpercent, otherbenefits, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	Thường	Khách hàng thông thường, không ưu đãi đặc biệt	0.00	\N	Active	2025-05-24 19:55:20.703862	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	VIP	Khách hàng thân thiết, ưu đãi giảm giá 5%	5.00	Ưu tiên hỗ trợ, nhận thông báo sớm về khuyến mãi	Active	2025-05-24 19:55:20.703862	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	Vàng	Khách hàng có doanh số lớn, ưu đãi giảm giá 10%	10.00	Tặng quà sinh nhật, hỗ trợ riêng	Active	2025-05-24 19:55:20.703862	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	Kim cương	Khách hàng chiến lược, ưu đãi giảm giá 15%	15.00	Tặng quà đặc biệt, tham gia sự kiện riêng	Active	2025-05-24 19:55:20.703862	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	Đại lý	Khách hàng là đại lý phân phối, ưu đãi riêng	20.00	Chiết khấu theo hợp đồng, hỗ trợ vận chuyển	Active	2025-05-24 19:55:20.703862	2025-05-24 19:56:20.294174	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5659 (class 0 OID 16972)
-- Dependencies: 238
-- Data for Name: customerpointhistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customerpointhistory (id, customerid, changetype, pointschanged, oldpoints, newpoints, reason, createdat, createdby) FROM stdin;
4	2	Cộng	25	100	125	Thưởng thêm cho khách hàng doanh nghiệp	2025-05-24 20:31:06.530761	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
3	2	Cộng	100	0	100	Thưởng tích điểm cho đơn hàng lớn	2025-05-24 20:23:24.135304	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	1	Cộng	50	0	50	Thưởng tích điểm khi mua nguyên liệu	2025-05-24 20:23:24.135304	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
5	1	Cộng	10	50	60	Thưởng thêm cho khách hàng cá nhân	2025-05-24 20:33:22.928632	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
6	2	Trừ	100	25	-75	Đổi điểm lấy voucher VOUCHER100P_2_20250524	2025-05-24 20:51:52.129901	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
7	2	Cộng	250	-75	175	Thưởng thêm cho khách hàng doanh nghiệp	2025-05-24 20:54:38.202781	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
9	2	Trừ	100	75	-25	Đổi điểm lấy voucher VOUCHER100P_3_20250524	2025-05-24 20:57:02.835395	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
10	2	Cộng	500	-25	475	Thưởng thêm cho khách hàng doanh nghiệp	2025-05-24 21:00:33.528485	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
11	2	Trừ	100	375	275	Đổi điểm lấy voucher VOUCHER100P_4_20250524	2025-05-24 21:00:41.9214	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
12	2	Cộng	250	275	525	Thưởng thêm cho khách hàng doanh nghiệp	2025-05-24 21:04:04.408746	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
14	2	Trừ	100	525	425	Đổi điểm lấy voucher VOUCHER100P_5_20250524	2025-05-24 21:04:57.001327	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
15	1	Cộng	250	60	310	Thưởng thêm cho khách hàng cá nhân gắn bó	2025-05-24 21:07:22.414121	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
16	1	Trừ	100	310	210	Đổi điểm lấy voucher VOUCHER100P_6_20250524	2025-05-24 21:08:57.104757	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
17	2	Trừ	225	425	200	Đổi điểm lấy voucher VOUCHER100P_7_20250524	2025-05-24 21:10:27.628174	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5657 (class 0 OID 16957)
-- Dependencies: 236
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, customercode, customername, contactname, phonenumber, email, address, taxcode, note, status, customerlevelid, points, createdat, updatedat, createdby, updatedby) FROM stdin;
1	KHCN001	Trần Thị Thu Hương	Trà Sữa Thu Hương	0909123456	trasuathuhuong@gmail.com	123 Đường Lê Văn Khương, Quận 12, TP. Hồ Chí Minh	\N	Chủ quán trà sữa nhỏ, thường nhập nguyên liệu mỗi tuần.	Active	1	210	2025-05-24 20:11:25.91877	2025-05-24 21:08:57.104757	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	KHDN001	Công ty TNHH Bánh Kẹo Ngọt Ngào	Lưu Thị Hoài Thương	02743888888	banhkeongotngao@ngotngao.com	KCN Sóng Thần, Dĩ An, Bình Dương	3701234567	Khách hàng doanh nghiệp, đặt hàng số lượng lớn theo tháng.	Active	5	200	2025-05-24 20:11:25.91877	2025-05-24 21:10:27.628174	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5701 (class 0 OID 17555)
-- Dependencies: 280
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deliveries (id, orderid, deliverycode, deliverydate, shippername, deliveryaddress, status, note, createdat, updatedat, createdby, updatedby, shippingproviderid, trackingnumber, shippingfee, trackingurl, syncstatus, synclog) FROM stdin;
\.


--
-- TOC entry 5642 (class 0 OID 16691)
-- Dependencies: 221
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, departmentcode, departmentname, description, status, createdat, updatedat, createdby) FROM stdin;
1	PKD	Phòng Kinh Doanh	Chuyên phụ trách kinh doanh và bán hàng	Active	2025-05-24 15:06:00.243321	\N	\N
2	PKT	Phòng Kế Toán	Chuyên phụ trách kế toán và tài chính	Active	2025-05-24 15:06:00.243321	\N	\N
3	PKTCL	Phòng Kiểm Tra Chất Lượng	Đảm bảo chất lượng sản phẩm	Active	2025-05-24 15:06:00.243321	\N	\N
4	PKH	Phòng Kho	Quản lý kho hàng và vật tư	Active	2025-05-24 15:06:00.243321	\N	\N
5	PNS	Phòng Nhân Sự	Quản lý nhân sự và tuyển dụng	Active	2025-05-24 15:06:00.243321	\N	\N
6	PSX	Phòng Sản Xuất	Quản lý dây chuyền sản xuất	Active	2025-05-24 15:06:00.243321	\N	\N
7	PKTBT	Phòng Kỹ Thuật/Bảo Trì	Quản lý máy móc, thiết bị và bảo trì	Active	2025-05-24 15:06:00.243321	\N	\N
8	PMH	Phòng Mua Hàng/Cung Ứng	Quản lý nhập nguyên vật liệu và cung ứng	Active	2025-05-24 15:06:00.243321	\N	\N
9	PIT	Phòng IT	Quản lý hệ thống công nghệ thông tin	Active	2025-05-24 15:06:00.243321	\N	\N
10	PMKT	Phòng Marketing	Phụ trách tiếp thị và quảng bá sản phẩm	Active	2025-05-24 15:06:00.243321	\N	\N
\.


--
-- TOC entry 5687 (class 0 OID 17388)
-- Dependencies: 266
-- Data for Name: inventorytransactionapprovals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventorytransactionapprovals (id, transactiontype, referencecode, approved, approvedat, approvedby, createdat, createdby) FROM stdin;
1	TransferOut	1	t	2025-05-25 23:21:57.449949	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	2025-05-25 23:21:57.449949	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5681 (class 0 OID 17293)
-- Dependencies: 260
-- Data for Name: inventorytransactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventorytransactions (id, productid, warehouseid, transactiontype, quantity, unitid, price, referencecode, description, createdat, createdby) FROM stdin;
1	1	1	Import	5000	1	1500.00	NK20240525-001	Nhập kho Túi nilon trắng	2025-05-25 23:18:32.401352	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	2	1	Import	1000	2	12000.00	NK20240525-002	Nhập kho Thùng carton 5 lớp	2025-05-25 23:18:32.401352	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
3	3	1	Import	200	8	35000.00	NK20240525-003	Nhập kho Màng PE quấn pallet	2025-05-25 23:18:32.401352	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
4	4	1	Import	500	1	8000.00	NK20240525-004	Nhập kho Băng keo vàng	2025-05-25 23:18:32.401352	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
5	5	1	Import	2000	10	1200.00	NK20240525-005	Nhập kho Hộp nhựa 500ml	2025-05-25 23:18:32.401352	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
6	6	1	Import	100	8	18000.00	NK20240525-006	Nhập kho Giấy Kraft cuộn	2025-05-25 23:18:32.401352	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
7	2	1	TransferOut	100	2	12000.00	1	Xuất chuyển kho sang TP.HCM	2025-05-25 23:21:57.449949	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
8	2	2	TransferIn	100	2	12000.00	1	Nhập chuyển kho từ Kho Tổng	2025-05-25 23:21:57.449949	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5710 (class 0 OID 17649)
-- Dependencies: 289
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, invoicecode, orderid, invoicedate, totalamount, status, fileurl, note, createdat, updatedat, createdby, updatedby) FROM stdin;
4	INV20250526-00000004	1	2025-05-26 10:55:35.680726	20520000.00	Issued	\N	\N	2025-05-26 10:55:35.680726	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	INV20250526-00000005	3	2025-05-26 10:59:48.716722	12960000.00	Issued	\N	\N	2025-05-26 10:59:48.716722	\N	\N	\N
6	INV20250526-00000006	2	2025-05-26 11:02:46.38684	3888000.00	Issued	\N	\N	2025-05-26 11:02:46.38684	\N	\N	\N
\.


--
-- TOC entry 5714 (class 0 OID 17714)
-- Dependencies: 293
-- Data for Name: metrictypes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metrictypes (metrictype, description) FROM stdin;
Revenue	Doanh thu
Quantity	Số lượng
Percent	Phần trăm
Discount	Chiết khấu
\.


--
-- TOC entry 5707 (class 0 OID 17623)
-- Dependencies: 286
-- Data for Name: orderapprovals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orderapprovals (id, orderid, flowid, approvalstep, steporder, rolename, approved, approvedat, approvedby, note, createdat, createdby) FROM stdin;
1	1	1	Trưởng phòng duyệt	1	Manager	t	2025-05-26 09:10:00	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	Duyệt OK	2025-05-26 10:42:24.652977	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	1	1	Kế toán duyệt	2	Accountant	f	\N	\N	\N	2025-05-26 10:42:24.652977	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5697 (class 0 OID 17498)
-- Dependencies: 276
-- Data for Name: orderdetails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orderdetails (id, orderid, productid, unitid, quantity, price, discount, vat, totalamount, note, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	1	1	1	5000	2000.00	0.00	8.00	10800000.00	Túi nilon trắng	Active	2025-05-26 10:42:24.652977	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	1	2	2	500	18000.00	0.00	8.00	9720000.00	Thùng carton 5 lớp	Active	2025-05-26 10:42:24.652977	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	2	5	10	2000	1800.00	0.00	8.00	3888000.00	Hộp nhựa 500ml	Active	2025-05-26 10:42:24.652977	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	3	2	2	1000	12000.00	0.00	8.00	12960000.00	Nhập thùng carton 5 lớp	Active	2025-05-26 10:42:24.652977	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5712 (class 0 OID 17673)
-- Dependencies: 291
-- Data for Name: orderlogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orderlogs (id, orderid, logtime, action, oldstatus, newstatus, note, performedby, details) FROM stdin;
1	1	2025-05-26 09:00:00	Created	\N	Confirmed	Tạo mới đơn hàng	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	{"OrderCode": "SO20250526-001"}
2	1	2025-05-26 09:10:00	StatusChanged	Confirmed	Approved	Đơn hàng đã được trưởng phòng duyệt	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	1	2025-05-26 10:00:00	StatusChanged	Approved	Completed	Đơn hàng đã hoàn tất	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	1	2025-05-26 10:55:35.680726	StatusChanged	Confirmed	Completed	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	1	2025-05-26 10:55:35.680726	StatusChanged	Approved	Completed	Chuyển trạng thái sang Completed	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	3	2025-05-26 10:59:48.716722	StatusChanged	Confirmed	Completed	\N	\N	\N
7	2	2025-05-26 11:02:46.38684	StatusChanged	Draft	Completed	Trạng thái đơn hàng chuyển từ "Draft" sang "Completed"	\N	{"NewStatus": "Completed", "OldStatus": "Draft", "OrderCode": "SO20250526-002", "UpdatedAt": "2025-05-26T11:02:46.38684", "UpdatedBy": null}
\.


--
-- TOC entry 5695 (class 0 OID 17479)
-- Dependencies: 274
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, ordercode, orderdate, customerid, supplierid, ordertype, status, totalamount, note, createdat, updatedat, createdby, updatedby) FROM stdin;
1	SO20250526-001	2025-05-26 09:00:00	\N	\N	Sale	Completed	20520000.00	Khách đặt hàng lần đầu	2025-05-26 10:42:24.652977	2025-05-26 10:55:35.680726	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
3	PO20250526-001	2025-05-26 11:00:00	\N	\N	Purchase	Completed	12960000.00	Mua thùng carton bổ sung	2025-05-26 10:42:24.652977	2025-05-26 10:59:48.716722	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	SO20250526-002	2025-05-26 10:00:00	\N	\N	Sale	Completed	3888000.00	Đơn hàng thử nghiệm	2025-05-26 10:42:24.652977	2025-05-26 11:02:46.38684	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5703 (class 0 OID 17585)
-- Dependencies: 282
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, orderid, paymentcode, paymentdate, amount, paymentmethod, status, note, createdat, updatedat, createdby, updatedby) FROM stdin;
1	1	PAY20250526-001	2025-05-26 09:30:00	20000000.00	Chuyển khoản	Completed	Thanh toán đợt 1	2025-05-26 10:45:19.723892	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	1	PAY20250526-002	2025-05-26 10:30:00	20000000.00	Chuyển khoản	Completed	Thanh toán đợt 2	2025-05-26 10:45:19.723892	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	2	PAY20250526-003	2025-05-26 11:00:00	15000000.00	Tiền mặt	Pending	Thanh toán thử nghiệm	2025-05-26 10:45:19.723892	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	3	PAY20250526-004	2025-05-26 12:00:00	12000000.00	Chuyển khoản	Completed	Thanh toán mua thùng carton	2025-05-26 10:45:19.723892	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5646 (class 0 OID 16717)
-- Dependencies: 225
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, status, createdat, updatedat, createdby) FROM stdin;
1	Xem danh sách hàng hóa	Active	2025-05-24 15:38:11.016479	\N	\N
2	Thêm mới hàng hóa	Active	2025-05-24 15:38:11.016479	\N	\N
3	Cập nhật thông tin hàng hóa	Active	2025-05-24 15:38:11.016479	\N	\N
4	Xóa hàng hóa	Active	2025-05-24 15:38:11.016479	\N	\N
5	Nhập kho	Active	2025-05-24 15:38:11.016479	\N	\N
6	Xuất kho	Active	2025-05-24 15:38:11.016479	\N	\N
7	Kiểm kê kho	Active	2025-05-24 15:38:11.016479	\N	\N
8	Xem báo cáo tồn kho	Active	2025-05-24 15:38:11.016479	\N	\N
9	Quản lý người dùng	Active	2025-05-24 15:38:11.016479	\N	\N
10	Phân quyền người dùng	Active	2025-05-24 15:38:11.016479	\N	\N
11	Xem lịch sử hoạt động	Active	2025-05-24 15:38:11.016479	\N	\N
12	Quản lý nhà cung cấp	Active	2025-05-24 15:38:11.016479	\N	\N
13	Tạo đơn mua hàng	Active	2025-05-24 15:38:11.016479	\N	\N
14	Duyệt đơn mua hàng	Active	2025-05-24 15:38:11.016479	\N	\N
15	Kiểm tra chất lượng hàng hóa	Active	2025-05-24 15:38:11.016479	\N	\N
16	Xem thông tin khách hàng	Active	2025-05-24 15:38:11.016479	\N	\N
17	Quản lý chương trình khuyến mãi	Active	2025-05-24 15:38:11.016479	\N	\N
18	Quản lý cấu hình hệ thống	Active	2025-05-24 15:43:50.598149	\N	\N
19	Quản lý phân quyền	Active	2025-05-24 15:43:50.598149	\N	\N
20	Xem toàn bộ báo cáo	Active	2025-05-24 15:43:50.598149	\N	\N
21	Xem nhật ký hệ thống	Active	2025-05-24 15:43:50.598149	\N	\N
22	Khóa/Mở tài khoản người dùng	Active	2025-05-24 15:43:50.598149	\N	\N
23	Khôi phục dữ liệu	Active	2025-05-24 15:43:50.598149	\N	\N
24	Quản lý phòng ban	Active	2025-05-24 15:43:50.598149	\N	\N
25	Quản lý thông báo hệ thống	Active	2025-05-24 15:43:50.598149	\N	\N
\.


--
-- TOC entry 5667 (class 0 OID 17119)
-- Dependencies: 246
-- Data for Name: productcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productcategories (id, categorycode, categoryname, description, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	BAOBI	Bao bì	Các loại bao bì thành phẩm như túi, hộp, thùng carton...	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	NGUYENLIEU	Nguyên liệu	Nguyên liệu sản xuất bao bì như giấy, nhựa, màng...	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	THIETBI	Thiết bị	Máy móc, thiết bị phục vụ sản xuất bao bì	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	PHUKIEN	Phụ kiện	Vật tư phụ trợ như băng keo, dây đai, mực in...	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	HOACHAT	Hóa chất/phụ gia	Hóa chất, phụ gia dùng trong sản xuất, xử lý, in ấn	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	VATTUTIEUHAO	Vật tư tiêu hao	Găng tay, khẩu trang, giấy lau, vật tư dùng một lần	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
7	BANHTHANHPHAM	Bán thành phẩm	Các chi tiết, bán thành phẩm chờ lắp ráp hoặc gia công tiếp	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
8	MAUTHIETKE	Sản phẩm mẫu/thiết kế	Mẫu thử, mẫu thiết kế, sản phẩm demo	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
9	DICHVU	Dịch vụ	Dịch vụ in ấn, gia công, đóng gói, vận chuyển liên quan đến sản phẩm	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
10	LOI_HUY	Sản phẩm lỗi/hủy	Quản lý hàng lỗi, hàng hủy, hàng trả về	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
11	BAOBITAISU	Bao bì tái sử dụng	Pallet, thùng nhựa, vật tư đóng gói có thể thu hồi	Active	2025-05-25 01:51:00.302407	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5675 (class 0 OID 17241)
-- Dependencies: 254
-- Data for Name: productimages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productimages (id, productid, imageurl, description, ismain, sortorder, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	1	https://drive.google.com/file/d/1omfNxEL9KGAQFi-v8MLezveg8IBH2gvF/view?usp=drive_link	Ảnh sản phẩm 1 - góc chính	t	1	Active	2025-05-25 12:52:32.343864	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	1	https://drive.google.com/file/d/1VK8Dj9FO4CKtWDoaz22KaqqvK2jMiJ76/view?usp=drive_link	Ảnh sản phẩm 1 - góc nghiêng	f	2	Active	2025-05-25 12:52:32.343864	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	1	https://drive.google.com/file/d/1tAOBZTxR1T2jtnp9kL_9fKc4kpDgH7fX/view?usp=drive_link	Ảnh sản phẩm 1 - chi tiết	f	3	Active	2025-05-25 12:52:32.343864	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5693 (class 0 OID 17432)
-- Dependencies: 272
-- Data for Name: productlots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productlots (id, productid, lotnumber, manufacturedate, expirydate, quantity, warehouseid, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	1	LOT202405A	2025-05-01	2026-05-01	2000	1	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	1	LOT202405B	2025-05-10	2026-05-10	3000	1	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	5	LOT202405C	2025-05-15	2027-05-15	1500	1	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	6	LOT202405D	2025-05-20	2028-05-20	100	1	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5691 (class 0 OID 17419)
-- Dependencies: 270
-- Data for Name: productprices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productprices (id, productid, pricetype, price, effectivefrom, effectiveto, status, createdat, createdby) FROM stdin;
1	1	Cost	1500.00	2025-05-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	1	Sale	2000.00	2025-05-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
3	1	Sale	2100.00	2025-06-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
4	2	Cost	12000.00	2025-05-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
5	2	Sale	18000.00	2025-05-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
6	2	Sale	18500.00	2025-07-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
7	5	Cost	1200.00	2025-05-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
8	5	Sale	1800.00	2025-05-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
9	5	Sale	1900.00	2025-08-01 00:00:00	\N	Active	2025-05-25 23:50:37.703062	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5673 (class 0 OID 17181)
-- Dependencies: 252
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, productcode, productname, categoryid, baseunitid, brand, origin, barcode, imageurl, description, costprice, saleprice, vat, minstock, maxstock, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	TUI_NILON_TRANG	Túi nilon trắng 30x40cm	1	1	Việt Nhật	Việt Nam	8938505970012	\N	Túi nilon trắng kích thước 30x40cm, dùng đóng gói thực phẩm.	1500.00	2000.00	8.00	1000	10000	Active	2025-05-25 12:21:57.991375	2025-05-25 12:28:10.073113	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	THUNG_CARTON_5L	Thùng carton 5 lớp 60x40x40cm	1	2	CartonPro	Việt Nam	8938505970029	\N	Thùng carton 5 lớp, kích thước 60x40x40cm, chịu lực tốt.	12000.00	18000.00	8.00	200	2000	Active	2025-05-25 12:21:57.991375	2025-05-25 12:28:10.073113	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	MANG_PE	Màng PE quấn pallet 2kg	1	8	PEWrap	Việt Nam	8938505970036	\N	Màng PE quấn pallet, khối lượng 2kg/cuộn, độ co giãn cao.	35000.00	45000.00	8.00	50	500	Active	2025-05-25 12:21:57.991375	2025-05-25 12:28:10.073113	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	BANG_KEO_VANG	Băng keo vàng 48mm x 100y	4	1	3F	Việt Nam	8938505970043	\N	Băng keo vàng, khổ 48mm, dài 100 yard, dán thùng.	8000.00	12000.00	8.00	100	1000	Active	2025-05-25 12:21:57.991375	2025-05-25 12:28:10.073113	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	HOP_NHUA_500ML	Hộp nhựa 500ml	1	10	Nhựa Việt	Việt Nam	8938505970050	\N	Hộp nhựa đựng thực phẩm dung tích 500ml.	1200.00	1800.00	8.00	500	5000	Active	2025-05-25 12:21:57.991375	2025-05-25 12:28:10.073113	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	GIAY_KRAFT	Giấy Kraft cuộn 60gsm	2	8	KraftPro	Indonesia	8938505970067	\N	Giấy Kraft cuộn, định lượng 60gsm, dùng làm bao bì.	18000.00	25000.00	8.00	20	200	Active	2025-05-25 12:21:57.991375	2025-05-25 12:29:28.912365	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5679 (class 0 OID 17278)
-- Dependencies: 258
-- Data for Name: productstocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productstocks (id, productid, warehouseid, quantity, minstock, maxstock, status, updatedat, updatedby) FROM stdin;
1	1	1	5000	1000	10000	Active	2025-05-25 23:18:52.043373	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
3	3	1	200	50	500	Active	2025-05-25 23:18:52.043373	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
4	4	1	500	100	1000	Active	2025-05-25 23:18:52.043373	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
5	5	1	2000	500	5000	Active	2025-05-25 23:18:52.043373	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
6	6	1	100	20	200	Active	2025-05-25 23:18:52.043373	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	2	1	900	200	2000	Active	2025-05-25 23:21:57.449949	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
7	2	2	100	0	\N	Active	2025-05-25 23:21:57.449949	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5689 (class 0 OID 17404)
-- Dependencies: 268
-- Data for Name: productsuppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productsuppliers (id, productid, supplierid, supplierproductcode, ismain, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	1	1	TUI_NILON_VN	t	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	1	5	TUI_NILON_TH	f	Active	2025-05-25 23:48:48.886956	2025-05-25 23:48:48.886956	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	1	3	TUI_NILON_NV	f	Active	2025-05-25 23:48:48.886956	2025-05-25 23:48:48.886956	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	2	2	THUNG_CARTON_CP	t	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	2	5	THUNG_CARTON_TH	f	Active	2025-05-25 23:48:48.886956	2025-05-25 23:48:48.886956	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	5	3	HOP_NHUA_NV	t	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
7	5	5	HOP_NHUA_TH	f	Active	2025-05-25 23:48:48.886956	2025-05-25 23:48:48.886956	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
8	6	4	KRAFT_KP	t	Active	2025-05-25 23:48:48.886956	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
9	6	5	KRAFT_TH	f	Active	2025-05-25 23:48:48.886956	2025-05-25 23:48:48.886956	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5719 (class 0 OID 17752)
-- Dependencies: 298
-- Data for Name: reportdetails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportdetails (id, reportid, reftype, refid, metrictype, value, note, createdat, updatedat, createdby, updatedby) FROM stdin;
1	1	Product	1	Revenue	50000000.00	Doanh thu sản phẩm 1	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	1	Product	2	Revenue	30000000.00	Doanh thu sản phẩm 2	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
3	1	Product	1	Quantity	2500.00	Số lượng bán sản phẩm 1	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
4	1	Customer	10	Revenue	20000000.00	Doanh thu khách hàng 10	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
5	2	Product	3	Revenue	120000000.00	Doanh thu sản phẩm 3	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
6	2	Order	5	Revenue	80000000.00	Doanh thu đơn hàng 5	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
7	2	Order	5	Discount	5000000.00	Chiết khấu đơn hàng 5	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5721 (class 0 OID 17785)
-- Dependencies: 300
-- Data for Name: reportlogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportlogs (id, reportid, action, logtime, performedby, details) FROM stdin;
1	1	Created	2025-05-26 11:26:42.322101	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	{"Value": 100000000.00, "ReportDate": "2025-05-26", "ReportType": "Doanh thu bán hàng", "ReportPeriod": "daily"}
2	2	Created	2025-05-26 11:26:42.322101	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	{"Value": 250000000.00, "ReportDate": "2025-05-01", "ReportType": "Doanh thu bán hàng", "ReportPeriod": "monthly"}
\.


--
-- TOC entry 5713 (class 0 OID 17707)
-- Dependencies: 292
-- Data for Name: reportreftypes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportreftypes (reftype, description) FROM stdin;
Product	Sản phẩm
Order	Đơn hàng
Customer	Khách hàng
Supplier	Nhà cung cấp
\.


--
-- TOC entry 5717 (class 0 OID 17737)
-- Dependencies: 296
-- Data for Name: reportsummaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportsummaries (id, reportdate, reporttype, reportperiod, value, note, createdat, updatedat, createdby, updatedby) FROM stdin;
1	2025-05-26	Doanh thu bán hàng	daily	100000000.00	Tổng doanh thu ngày 26/05/2025	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
2	2025-05-01	Doanh thu bán hàng	monthly	250000000.00	Tổng doanh thu tháng 5/2025	2025-05-26 11:26:42.322101	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c
\.


--
-- TOC entry 5648 (class 0 OID 16743)
-- Dependencies: 227
-- Data for Name: rolepermissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rolepermissions (roleid, permissionid) FROM stdin;
1	18
1	19
1	20
1	21
1	22
1	23
1	24
1	25
\.


--
-- TOC entry 5644 (class 0 OID 16705)
-- Dependencies: 223
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, status, createdat, updatedat, createdby) FROM stdin;
1	Quản trị viên	Active	2025-05-24 15:29:02.756168	\N	\N
2	Quản lý kho	Active	2025-05-24 15:29:02.756168	\N	\N
3	Nhân viên kho	Active	2025-05-24 15:29:02.756168	\N	\N
4	Nhân viên mua hàng/cung ứng	Active	2025-05-24 15:29:02.756168	\N	\N
5	Nhân viên kiểm tra chất lượng	Active	2025-05-24 15:29:02.756168	\N	\N
6	Nhân viên kế toán	Active	2025-05-24 15:29:02.756168	\N	\N
7	Nhân viên IT	Active	2025-05-24 15:29:02.756168	\N	\N
8	Nhân viên marketing	Active	2025-05-24 15:29:02.756168	\N	\N
9	Khách hàng	Active	2025-05-24 15:29:02.756168	\N	\N
\.


--
-- TOC entry 5699 (class 0 OID 17540)
-- Dependencies: 278
-- Data for Name: shippingproviders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shippingproviders (id, providercode, providername, contactname, phonenumber, email, website, status, note, createdat, updatedat, createdby, updatedby) FROM stdin;
\.


--
-- TOC entry 5683 (class 0 OID 17307)
-- Dependencies: 262
-- Data for Name: stockadjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stockadjustments (id, productid, warehouseid, oldquantity, newquantity, reason, adjustmentdate, createdby) FROM stdin;
\.


--
-- TOC entry 5663 (class 0 OID 17056)
-- Dependencies: 242
-- Data for Name: suppliercategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliercategories (id, categoryname, description, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	Nguyên vật liệu	Nhà cung cấp giấy, nhựa, màng, hạt nhựa, hóa chất dùng sản xuất bao bì	Active	2025-05-25 00:28:02.187348	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	Bao bì thành phẩm	Nhà cung cấp các loại bao bì đã hoàn thiện để phân phối hoặc đóng gói	Active	2025-05-25 00:28:02.187348	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	Thiết bị & Máy móc	Nhà cung cấp máy in, máy cắt, máy ép, thiết bị sản xuất bao bì	Active	2025-05-25 00:28:02.187348	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	Vật tư phụ trợ	Nhà cung cấp băng keo, dây đai, mực in, khuôn mẫu, vật tư tiêu hao	Active	2025-05-25 00:28:02.187348	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	Dịch vụ vận chuyển	Đơn vị cung cấp dịch vụ vận chuyển, giao nhận, logistics	Active	2025-05-25 00:28:02.187348	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	Dịch vụ bảo trì/sửa chữa	Nhà cung cấp dịch vụ bảo trì, sửa chữa máy móc thiết bị	Active	2025-05-25 00:28:02.187348	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
7	Dịch vụ kiểm định/chứng nhận	Đơn vị kiểm định chất lượng, cấp chứng nhận an toàn, tiêu chuẩn	Active	2025-05-25 00:28:02.187348	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
8	Khác	Các nhà cung cấp khác liên quan đến hoạt động kho và sản xuất bao bì	Active	2025-05-25 00:28:02.187348	2025-05-25 00:29:20.191583	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5665 (class 0 OID 17081)
-- Dependencies: 244
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, suppliercode, suppliername, contactname, phonenumber, email, address, country, region, taxcode, bankaccount, bankname, website, note, categoryid, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	NCCVL001	Công ty TNHH Nguyên Liệu Việt	Nguyễn Văn Bình	0909123456	lienhe@nguyenlieuviet.com	Số 88, Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh	Việt Nam	TP. Hồ Chí Minh	0312345678	1234567890123	BIDV	https://nguyenlieuviet.com	Chuyên cung cấp hạt nhựa, giấy, màng nhựa cho sản xuất bao bì.	1	Active	2025-05-25 00:34:32.176917	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	NCCVC001	Nam Logistics	Trần Nguyễn Vũ Nam	0912345678	contact@namlogistics.vn	Số 10, Đường D1, KCN Sóng Thần, Dĩ An, Bình Dương	Việt Nam	Bình Dương	3701234567	9876543210987	BIDV	https://namlogistics.vn	Chuyên dịch vụ vận chuyển, giao nhận hàng hóa toàn quốc.	5	Active	2025-05-25 00:40:37.909546	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	NCC_VIETNHAT	Công ty TNHH Việt Nhật	Nguyễn Văn A	0909123456	vietnhat@example.com	Số 1, Hà Nội	Việt Nam	Hà Nội	0101234567	123456789	Vietcombank	www.vietnhat.com	\N	\N	Active	2025-05-25 23:47:43.024606	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	NCC_CARTONPRO	CartonPro JSC	Trần Thị B	0909234567	cartonpro@example.com	KCN Sóng Thần, Bình Dương	Việt Nam	Bình Dương	3700123456	234567890	ACB	www.cartonpro.vn	\N	\N	Active	2025-05-25 23:47:43.024606	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	NCC_NHUAVIET	Nhựa Việt	Lê Văn C	0909345678	nhuaviet@example.com	Số 10, TP.HCM	Việt Nam	TP.HCM	0301234567	345678901	BIDV	www.nhuaviet.com	\N	\N	Active	2025-05-25 23:47:43.024606	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	NCC_KRAFPRO	KraftPro Indonesia	Siti D	+628123456789	kraftpro@example.com	Jakarta	Indonesia	Jakarta	ID12345678	456789012	Mandiri	www.kraftpro.co.id	\N	\N	Active	2025-05-25 23:47:43.024606	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
7	NCC_TONGHOP	Công ty Tổng Hợp	Phạm Văn E	0909567890	tonghop@example.com	Số 99, Đà Nẵng	Việt Nam	Đà Nẵng	0401234567	567890123	Techcombank	www.tonghop.com	\N	\N	Active	2025-05-25 23:47:43.024606	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5685 (class 0 OID 17319)
-- Dependencies: 264
-- Data for Name: transferrequests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transferrequests (id, productid, fromwarehouseid, towarehouseid, quantity, status, requestedat, approvedat, completedat, requestedby, approvedby, completedby, note) FROM stdin;
1	2	1	2	100	Completed	2025-05-25 23:21:57.449949	2025-05-25 23:21:57.449949	2025-05-25 23:21:57.449949	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	Chuyển thùng carton cho kho TP.HCM
\.


--
-- TOC entry 5671 (class 0 OID 17167)
-- Dependencies: 250
-- Data for Name: unitconversions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unitconversions (id, fromunitid, tounitid, conversionrate, description, createdat, updatedat, createdby, updatedby) FROM stdin;
1	12	11	50.000000	1 Thùng = 50 Cái	2025-05-25 12:48:08.163523	2025-05-25 12:48:41.696367	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5669 (class 0 OID 17148)
-- Dependencies: 248
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, unitcode, unitname, description, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	CAI	Cái	Đơn vị đếm cơ bản	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	THUNG	Thùng	Đơn vị đóng gói lớn, thường chứa nhiều cái	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	KG	Kilogram	Đơn vị đo khối lượng	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	GRAM	Gram	Đơn vị đo khối lượng nhỏ	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	M2	Mét vuông	Đơn vị đo diện tích	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	LIT	Lít	Đơn vị đo thể tích	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
7	MET	Mét	Đơn vị đo chiều dài	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
8	CUON	Cuộn	Đơn vị đóng gói cho màng, giấy, nhãn	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
9	CHAI	Chai	Đơn vị đóng gói chất lỏng, hóa chất	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
10	HOP	Hộp	Đơn vị đóng gói nhỏ	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
11	TUI	Túi	Đơn vị đóng gói linh hoạt	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
12	TAN	Tấn	Đơn vị đo khối lượng lớn	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
13	TA	Tạ	Đơn vị đo khối lượng trung bình	Active	2025-05-25 12:11:50.534233	2025-05-25 12:21:29.64616	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
14	BO	Bộ	Đơn vị cho sản phẩm dạng bộ, set	Active	2025-05-25 12:11:50.534233	2025-05-25 12:28:48.712614	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5651 (class 0 OID 16774)
-- Dependencies: 230
-- Data for Name: useractivitylogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.useractivitylogs (id, userid, activitytype, tablename, recordid, description, olddata, newdata, issuccess, activitytime, ipaddress) FROM stdin;
\.


--
-- TOC entry 5653 (class 0 OID 16786)
-- Dependencies: 232
-- Data for Name: userchangehistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.userchangehistory (id, userid, changedfield, oldvalue, newvalue, changedat, changedby) FROM stdin;
1	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	Email	vunamisme@gmail.com	vunamisme1@gmail.com	2025-05-24 16:07:12.329087	\N
2	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	PasswordHash	11062003	$2a$06$2TAib2/HULrn1DxGeail7esjuvGKHxW7Yoaf.uSxU1reZxY6LF.pi	2025-05-24 16:12:39.484061	\N
3	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	Email	vunamisme1@gmail.com	vunamisme@gmail.com	2025-05-24 16:18:27.076603	\N
\.


--
-- TOC entry 5649 (class 0 OID 16758)
-- Dependencies: 228
-- Data for Name: userpermissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.userpermissions (userid, permissionid) FROM stdin;
\.


--
-- TOC entry 5647 (class 0 OID 16728)
-- Dependencies: 226
-- Data for Name: userroles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.userroles (userid, roleid) FROM stdin;
94ead680-b64c-4d0e-a3eb-8e87d7978f1c	1
\.


--
-- TOC entry 5640 (class 0 OID 16669)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, usercode, username, passwordhash, fullname, email, phonenumber, address, status, avatarurl, dateofbirth, gender, lastloginat, createdat, updatedat, createdby, departmentid, updatedby) FROM stdin;
94ead680-b64c-4d0e-a3eb-8e87d7978f1c	ADMIN	admin	$2a$06$2TAib2/HULrn1DxGeail7esjuvGKHxW7Yoaf.uSxU1reZxY6LF.pi	Quản trị hệ thống	vunamisme@gmail.com	\N	\N	Active	https://drive.google.com/file/d/1BsCdUcIYRV3N8j7-s5-3CG2KIwn5cziw/view?usp=sharing	2003-06-11	Male	\N	2025-05-24 15:16:09.749453	2025-05-24 16:18:27.076603	\N	\N	\N
\.


--
-- TOC entry 5661 (class 0 OID 17025)
-- Dependencies: 240
-- Data for Name: vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vouchers (id, vouchercode, customerid, discountpercent, pointsexchanged, status, expiredat, usedat, createdat, updatedat, createdby, updatedby) FROM stdin;
1	VOUCHER100P_2_20250524	2	1.00	100	Active	2025-05-31 20:51:52.129901	\N	2025-05-24 20:51:52.129901	2025-05-24 20:51:52.129901	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	VOUCHER100P_3_20250524	2	1.00	100	Active	2025-05-31 20:57:02.835395	\N	2025-05-24 20:57:02.835395	2025-05-24 20:57:02.835395	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	VOUCHER100P_4_20250524	2	1.00	100	Active	2025-05-31 21:00:41.9214	\N	2025-05-24 21:00:41.9214	2025-05-24 21:00:41.9214	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
6	VOUCHER100P_5_20250524	2	1.00	100	Active	2025-05-31 21:04:57.001327	\N	2025-05-24 21:04:57.001327	2025-05-24 21:04:57.001327	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
7	VOUCHER100P_6_20250524	1	1.00	100	Active	2025-05-27 21:08:57.104757	\N	2025-05-24 21:08:57.104757	2025-05-24 21:08:57.104757	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
8	VOUCHER100P_7_20250524	2	2.25	225	Active	2025-05-27 21:10:27.628174	\N	2025-05-24 21:10:27.628174	2025-05-24 21:10:27.628174	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5677 (class 0 OID 17262)
-- Dependencies: 256
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouses (id, warehousecode, warehousename, address, description, status, createdat, updatedat, createdby, updatedby) FROM stdin;
1	KHO_TONG	Kho Tổng	KCN Sóng Thần, Dĩ An, Bình Dương	Kho trung tâm lưu trữ hàng hóa chính	Active	2025-05-25 22:52:01.961907	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
2	KHO_TPHCM	Kho TP.HCM	Số 100, Đường Nguyễn Văn Linh, Quận 7, TP.HCM	Kho phân phối khu vực miền Nam	Active	2025-05-25 22:52:01.961907	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
3	KHO_HANOI	Kho Hà Nội	Số 88, Đường Giải Phóng, Hoàng Mai, Hà Nội	Kho phân phối khu vực miền Bắc	Active	2025-05-25 22:52:01.961907	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
4	KHO_NGUYENLIEU	Kho Nguyên Liệu	KCN Tân Bình, Quận Tân Bình, TP.HCM	Kho lưu trữ nguyên vật liệu sản xuất	Active	2025-05-25 22:52:01.961907	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
5	KHO_THANHPHAM	Kho Thành Phẩm	KCN VSIP, Thuận An, Bình Dương	Kho lưu trữ thành phẩm chờ xuất bán	Active	2025-05-25 22:52:01.961907	\N	94ead680-b64c-4d0e-a3eb-8e87d7978f1c	\N
\.


--
-- TOC entry 5766 (class 0 OID 0)
-- Dependencies: 283
-- Name: approvalflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approvalflows_id_seq', 1, false);


--
-- TOC entry 5767 (class 0 OID 0)
-- Dependencies: 233
-- Name: customerlevels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customerlevels_id_seq', 5, true);


--
-- TOC entry 5768 (class 0 OID 0)
-- Dependencies: 237
-- Name: customerpointhistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customerpointhistory_id_seq', 17, true);


--
-- TOC entry 5769 (class 0 OID 0)
-- Dependencies: 235
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 2, true);


--
-- TOC entry 5770 (class 0 OID 0)
-- Dependencies: 279
-- Name: deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deliveries_id_seq', 1, false);


--
-- TOC entry 5771 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 10, true);


--
-- TOC entry 5772 (class 0 OID 0)
-- Dependencies: 265
-- Name: inventorytransactionapprovals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventorytransactionapprovals_id_seq', 1, true);


--
-- TOC entry 5773 (class 0 OID 0)
-- Dependencies: 259
-- Name: inventorytransactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventorytransactions_id_seq', 8, true);


--
-- TOC entry 5774 (class 0 OID 0)
-- Dependencies: 288
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 6, true);


--
-- TOC entry 5775 (class 0 OID 0)
-- Dependencies: 285
-- Name: orderapprovals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orderapprovals_id_seq', 1, false);


--
-- TOC entry 5776 (class 0 OID 0)
-- Dependencies: 275
-- Name: orderdetails_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orderdetails_id_seq', 1, false);


--
-- TOC entry 5777 (class 0 OID 0)
-- Dependencies: 290
-- Name: orderlogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orderlogs_id_seq', 7, true);


--
-- TOC entry 5778 (class 0 OID 0)
-- Dependencies: 273
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- TOC entry 5779 (class 0 OID 0)
-- Dependencies: 281
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- TOC entry 5780 (class 0 OID 0)
-- Dependencies: 224
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 25, true);


--
-- TOC entry 5781 (class 0 OID 0)
-- Dependencies: 245
-- Name: productcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productcategories_id_seq', 11, true);


--
-- TOC entry 5782 (class 0 OID 0)
-- Dependencies: 253
-- Name: productimages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productimages_id_seq', 3, true);


--
-- TOC entry 5783 (class 0 OID 0)
-- Dependencies: 271
-- Name: productlots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productlots_id_seq', 4, true);


--
-- TOC entry 5784 (class 0 OID 0)
-- Dependencies: 269
-- Name: productprices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productprices_id_seq', 9, true);


--
-- TOC entry 5785 (class 0 OID 0)
-- Dependencies: 251
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 6, true);


--
-- TOC entry 5786 (class 0 OID 0)
-- Dependencies: 257
-- Name: productstocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productstocks_id_seq', 7, true);


--
-- TOC entry 5787 (class 0 OID 0)
-- Dependencies: 267
-- Name: productsuppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productsuppliers_id_seq', 9, true);


--
-- TOC entry 5788 (class 0 OID 0)
-- Dependencies: 297
-- Name: reportdetails_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reportdetails_id_seq', 7, true);


--
-- TOC entry 5789 (class 0 OID 0)
-- Dependencies: 299
-- Name: reportlogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reportlogs_id_seq', 2, true);


--
-- TOC entry 5790 (class 0 OID 0)
-- Dependencies: 295
-- Name: reportsummaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reportsummaries_id_seq', 2, true);


--
-- TOC entry 5791 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 9, true);


--
-- TOC entry 5792 (class 0 OID 0)
-- Dependencies: 287
-- Name: seq_invoice_code; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_invoice_code', 6, true);


--
-- TOC entry 5793 (class 0 OID 0)
-- Dependencies: 277
-- Name: shippingproviders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shippingproviders_id_seq', 1, false);


--
-- TOC entry 5794 (class 0 OID 0)
-- Dependencies: 261
-- Name: stockadjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stockadjustments_id_seq', 1, false);


--
-- TOC entry 5795 (class 0 OID 0)
-- Dependencies: 241
-- Name: suppliercategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliercategories_id_seq', 8, true);


--
-- TOC entry 5796 (class 0 OID 0)
-- Dependencies: 243
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 7, true);


--
-- TOC entry 5797 (class 0 OID 0)
-- Dependencies: 263
-- Name: transferrequests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transferrequests_id_seq', 1, true);


--
-- TOC entry 5798 (class 0 OID 0)
-- Dependencies: 249
-- Name: unitconversions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unitconversions_id_seq', 1, true);


--
-- TOC entry 5799 (class 0 OID 0)
-- Dependencies: 247
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_id_seq', 14, true);


--
-- TOC entry 5800 (class 0 OID 0)
-- Dependencies: 229
-- Name: useractivitylogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.useractivitylogs_id_seq', 1, false);


--
-- TOC entry 5801 (class 0 OID 0)
-- Dependencies: 231
-- Name: userchangehistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.userchangehistory_id_seq', 3, true);


--
-- TOC entry 5802 (class 0 OID 0)
-- Dependencies: 239
-- Name: vouchers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vouchers_id_seq', 8, true);


--
-- TOC entry 5803 (class 0 OID 0)
-- Dependencies: 255
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 5, true);


--
-- TOC entry 5375 (class 2606 OID 17725)
-- Name: allowedmetrics allowedmetrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowedmetrics
    ADD CONSTRAINT allowedmetrics_pkey PRIMARY KEY (reftype, metrictype);


--
-- TOC entry 5349 (class 2606 OID 17619)
-- Name: approvalflows approvalflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approvalflows
    ADD CONSTRAINT approvalflows_pkey PRIMARY KEY (id);


--
-- TOC entry 5213 (class 2606 OID 16955)
-- Name: customerlevels customerlevels_levelname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerlevels
    ADD CONSTRAINT customerlevels_levelname_key UNIQUE (levelname);


--
-- TOC entry 5215 (class 2606 OID 16953)
-- Name: customerlevels customerlevels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerlevels
    ADD CONSTRAINT customerlevels_pkey PRIMARY KEY (id);


--
-- TOC entry 5221 (class 2606 OID 16981)
-- Name: customerpointhistory customerpointhistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerpointhistory
    ADD CONSTRAINT customerpointhistory_pkey PRIMARY KEY (id);


--
-- TOC entry 5217 (class 2606 OID 16970)
-- Name: customers customers_customercode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customercode_key UNIQUE (customercode);


--
-- TOC entry 5219 (class 2606 OID 16968)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 5336 (class 2606 OID 17570)
-- Name: deliveries deliveries_deliverycode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_deliverycode_key UNIQUE (deliverycode);


--
-- TOC entry 5338 (class 2606 OID 17568)
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- TOC entry 5191 (class 2606 OID 16703)
-- Name: departments departments_departmentcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_departmentcode_key UNIQUE (departmentcode);


--
-- TOC entry 5193 (class 2606 OID 16701)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 5300 (class 2606 OID 17395)
-- Name: inventorytransactionapprovals inventorytransactionapprovals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventorytransactionapprovals
    ADD CONSTRAINT inventorytransactionapprovals_pkey PRIMARY KEY (id);


--
-- TOC entry 5285 (class 2606 OID 17302)
-- Name: inventorytransactions inventorytransactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventorytransactions
    ADD CONSTRAINT inventorytransactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5361 (class 2606 OID 17662)
-- Name: invoices invoices_invoicecode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoicecode_key UNIQUE (invoicecode);


--
-- TOC entry 5363 (class 2606 OID 17660)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 5373 (class 2606 OID 17720)
-- Name: metrictypes metrictypes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metrictypes
    ADD CONSTRAINT metrictypes_pkey PRIMARY KEY (metrictype);


--
-- TOC entry 5357 (class 2606 OID 17632)
-- Name: orderapprovals orderapprovals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderapprovals
    ADD CONSTRAINT orderapprovals_pkey PRIMARY KEY (id);


--
-- TOC entry 5329 (class 2606 OID 17510)
-- Name: orderdetails orderdetails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderdetails
    ADD CONSTRAINT orderdetails_pkey PRIMARY KEY (id);


--
-- TOC entry 5369 (class 2606 OID 17681)
-- Name: orderlogs orderlogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderlogs
    ADD CONSTRAINT orderlogs_pkey PRIMARY KEY (id);


--
-- TOC entry 5323 (class 2606 OID 17493)
-- Name: orders orders_ordercode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_ordercode_key UNIQUE (ordercode);


--
-- TOC entry 5325 (class 2606 OID 17491)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5345 (class 2606 OID 17598)
-- Name: payments payments_paymentcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_paymentcode_key UNIQUE (paymentcode);


--
-- TOC entry 5347 (class 2606 OID 17596)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5199 (class 2606 OID 16727)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 5201 (class 2606 OID 16725)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5241 (class 2606 OID 17132)
-- Name: productcategories productcategories_categorycode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcategories
    ADD CONSTRAINT productcategories_categorycode_key UNIQUE (categorycode);


--
-- TOC entry 5243 (class 2606 OID 17134)
-- Name: productcategories productcategories_categoryname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcategories
    ADD CONSTRAINT productcategories_categoryname_key UNIQUE (categoryname);


--
-- TOC entry 5245 (class 2606 OID 17130)
-- Name: productcategories productcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcategories
    ADD CONSTRAINT productcategories_pkey PRIMARY KEY (id);


--
-- TOC entry 5268 (class 2606 OID 17253)
-- Name: productimages productimages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages
    ADD CONSTRAINT productimages_pkey PRIMARY KEY (id);


--
-- TOC entry 5316 (class 2606 OID 17440)
-- Name: productlots productlots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productlots
    ADD CONSTRAINT productlots_pkey PRIMARY KEY (id);


--
-- TOC entry 5318 (class 2606 OID 17442)
-- Name: productlots productlots_productid_lotnumber_warehouseid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productlots
    ADD CONSTRAINT productlots_productid_lotnumber_warehouseid_key UNIQUE (productid, lotnumber, warehouseid);


--
-- TOC entry 5311 (class 2606 OID 17428)
-- Name: productprices productprices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productprices
    ADD CONSTRAINT productprices_pkey PRIMARY KEY (id);


--
-- TOC entry 5263 (class 2606 OID 17239)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 5265 (class 2606 OID 17195)
-- Name: products products_productcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_productcode_key UNIQUE (productcode);


--
-- TOC entry 5278 (class 2606 OID 17287)
-- Name: productstocks productstocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productstocks
    ADD CONSTRAINT productstocks_pkey PRIMARY KEY (id);


--
-- TOC entry 5280 (class 2606 OID 17289)
-- Name: productstocks productstocks_productid_warehouseid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productstocks
    ADD CONSTRAINT productstocks_productid_warehouseid_key UNIQUE (productid, warehouseid);


--
-- TOC entry 5304 (class 2606 OID 17413)
-- Name: productsuppliers productsuppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsuppliers
    ADD CONSTRAINT productsuppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 5306 (class 2606 OID 17415)
-- Name: productsuppliers productsuppliers_productid_supplierid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsuppliers
    ADD CONSTRAINT productsuppliers_productid_supplierid_key UNIQUE (productid, supplierid);


--
-- TOC entry 5385 (class 2606 OID 17760)
-- Name: reportdetails reportdetails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportdetails
    ADD CONSTRAINT reportdetails_pkey PRIMARY KEY (id);


--
-- TOC entry 5388 (class 2606 OID 17793)
-- Name: reportlogs reportlogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportlogs
    ADD CONSTRAINT reportlogs_pkey PRIMARY KEY (id);


--
-- TOC entry 5371 (class 2606 OID 17713)
-- Name: reportreftypes reportreftypes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportreftypes
    ADD CONSTRAINT reportreftypes_pkey PRIMARY KEY (reftype);


--
-- TOC entry 5378 (class 2606 OID 17747)
-- Name: reportsummaries reportsummaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportsummaries
    ADD CONSTRAINT reportsummaries_pkey PRIMARY KEY (id);


--
-- TOC entry 5205 (class 2606 OID 16747)
-- Name: rolepermissions rolepermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_pkey PRIMARY KEY (roleid, permissionid);


--
-- TOC entry 5195 (class 2606 OID 16715)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5197 (class 2606 OID 16713)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5332 (class 2606 OID 17550)
-- Name: shippingproviders shippingproviders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shippingproviders
    ADD CONSTRAINT shippingproviders_pkey PRIMARY KEY (id);


--
-- TOC entry 5334 (class 2606 OID 17552)
-- Name: shippingproviders shippingproviders_providercode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shippingproviders
    ADD CONSTRAINT shippingproviders_providercode_key UNIQUE (providercode);


--
-- TOC entry 5289 (class 2606 OID 17315)
-- Name: stockadjustments stockadjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stockadjustments
    ADD CONSTRAINT stockadjustments_pkey PRIMARY KEY (id);


--
-- TOC entry 5228 (class 2606 OID 17068)
-- Name: suppliercategories suppliercategories_categoryname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliercategories
    ADD CONSTRAINT suppliercategories_categoryname_key UNIQUE (categoryname);


--
-- TOC entry 5230 (class 2606 OID 17066)
-- Name: suppliercategories suppliercategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliercategories
    ADD CONSTRAINT suppliercategories_pkey PRIMARY KEY (id);


--
-- TOC entry 5234 (class 2606 OID 17098)
-- Name: suppliers suppliers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_email_key UNIQUE (email);


--
-- TOC entry 5236 (class 2606 OID 17094)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 5238 (class 2606 OID 17096)
-- Name: suppliers suppliers_suppliercode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_suppliercode_key UNIQUE (suppliercode);


--
-- TOC entry 5295 (class 2606 OID 17329)
-- Name: transferrequests transferrequests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferrequests
    ADD CONSTRAINT transferrequests_pkey PRIMARY KEY (id);


--
-- TOC entry 5257 (class 2606 OID 17177)
-- Name: unitconversions unitconversions_fromunitid_tounitid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unitconversions
    ADD CONSTRAINT unitconversions_fromunitid_tounitid_key UNIQUE (fromunitid, tounitid);


--
-- TOC entry 5259 (class 2606 OID 17175)
-- Name: unitconversions unitconversions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unitconversions
    ADD CONSTRAINT unitconversions_pkey PRIMARY KEY (id);


--
-- TOC entry 5249 (class 2606 OID 17222)
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- TOC entry 5251 (class 2606 OID 17161)
-- Name: units units_unitcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_unitcode_key UNIQUE (unitcode);


--
-- TOC entry 5253 (class 2606 OID 17163)
-- Name: units units_unitname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_unitname_key UNIQUE (unitname);


--
-- TOC entry 5365 (class 2606 OID 17671)
-- Name: invoices uq_invoices_invoicecode; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT uq_invoices_invoicecode UNIQUE (invoicecode);


--
-- TOC entry 5380 (class 2606 OID 17749)
-- Name: reportsummaries uq_reportsummaries_date_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportsummaries
    ADD CONSTRAINT uq_reportsummaries_date_type UNIQUE (reportdate, reporttype, reportperiod);


--
-- TOC entry 5209 (class 2606 OID 16784)
-- Name: useractivitylogs useractivitylogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useractivitylogs
    ADD CONSTRAINT useractivitylogs_pkey PRIMARY KEY (id);


--
-- TOC entry 5211 (class 2606 OID 16794)
-- Name: userchangehistory userchangehistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userchangehistory
    ADD CONSTRAINT userchangehistory_pkey PRIMARY KEY (id);


--
-- TOC entry 5207 (class 2606 OID 16762)
-- Name: userpermissions userpermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userpermissions
    ADD CONSTRAINT userpermissions_pkey PRIMARY KEY (userid, permissionid);


--
-- TOC entry 5203 (class 2606 OID 16732)
-- Name: userroles userroles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_pkey PRIMARY KEY (userid, roleid);


--
-- TOC entry 5183 (class 2606 OID 16686)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5185 (class 2606 OID 16680)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5187 (class 2606 OID 16682)
-- Name: users users_usercode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_usercode_key UNIQUE (usercode);


--
-- TOC entry 5189 (class 2606 OID 16684)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5223 (class 2606 OID 17033)
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- TOC entry 5225 (class 2606 OID 17035)
-- Name: vouchers vouchers_vouchercode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_vouchercode_key UNIQUE (vouchercode);


--
-- TOC entry 5272 (class 2606 OID 17272)
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- TOC entry 5274 (class 2606 OID 17274)
-- Name: warehouses warehouses_warehousecode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_warehousecode_key UNIQUE (warehousecode);


--
-- TOC entry 5350 (class 1259 OID 17621)
-- Name: idx_approvalflows_flowname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approvalflows_flowname ON public.approvalflows USING btree (flowname);


--
-- TOC entry 5351 (class 1259 OID 17620)
-- Name: idx_approvalflows_ordertype; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approvalflows_ordertype ON public.approvalflows USING btree (ordertype);


--
-- TOC entry 5339 (class 1259 OID 17571)
-- Name: idx_deliveries_orderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deliveries_orderid ON public.deliveries USING btree (orderid);


--
-- TOC entry 5340 (class 1259 OID 17573)
-- Name: idx_deliveries_providerid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deliveries_providerid ON public.deliveries USING btree (shippingproviderid);


--
-- TOC entry 5341 (class 1259 OID 17572)
-- Name: idx_deliveries_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deliveries_status ON public.deliveries USING btree (status);


--
-- TOC entry 5296 (class 1259 OID 17398)
-- Name: idx_inventoryapprovals_approved; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventoryapprovals_approved ON public.inventorytransactionapprovals USING btree (approved);


--
-- TOC entry 5297 (class 1259 OID 17397)
-- Name: idx_inventoryapprovals_refcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventoryapprovals_refcode ON public.inventorytransactionapprovals USING btree (referencecode);


--
-- TOC entry 5298 (class 1259 OID 17396)
-- Name: idx_inventoryapprovals_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventoryapprovals_type ON public.inventorytransactionapprovals USING btree (transactiontype);


--
-- TOC entry 5281 (class 1259 OID 17303)
-- Name: idx_inventorytransactions_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventorytransactions_productid ON public.inventorytransactions USING btree (productid);


--
-- TOC entry 5282 (class 1259 OID 17305)
-- Name: idx_inventorytransactions_transactiontype; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventorytransactions_transactiontype ON public.inventorytransactions USING btree (transactiontype);


--
-- TOC entry 5283 (class 1259 OID 17304)
-- Name: idx_inventorytransactions_warehouseid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventorytransactions_warehouseid ON public.inventorytransactions USING btree (warehouseid);


--
-- TOC entry 5358 (class 1259 OID 17663)
-- Name: idx_invoices_orderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_orderid ON public.invoices USING btree (orderid);


--
-- TOC entry 5359 (class 1259 OID 17664)
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- TOC entry 5352 (class 1259 OID 17641)
-- Name: idx_orderapprovals_flowid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderapprovals_flowid ON public.orderapprovals USING btree (flowid);


--
-- TOC entry 5353 (class 1259 OID 17638)
-- Name: idx_orderapprovals_orderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderapprovals_orderid ON public.orderapprovals USING btree (orderid);


--
-- TOC entry 5354 (class 1259 OID 17640)
-- Name: idx_orderapprovals_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderapprovals_role ON public.orderapprovals USING btree (rolename);


--
-- TOC entry 5355 (class 1259 OID 17639)
-- Name: idx_orderapprovals_step; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderapprovals_step ON public.orderapprovals USING btree (approvalstep);


--
-- TOC entry 5326 (class 1259 OID 17511)
-- Name: idx_orderdetails_orderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderdetails_orderid ON public.orderdetails USING btree (orderid);


--
-- TOC entry 5327 (class 1259 OID 17512)
-- Name: idx_orderdetails_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderdetails_productid ON public.orderdetails USING btree (productid);


--
-- TOC entry 5366 (class 1259 OID 17683)
-- Name: idx_orderlogs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderlogs_action ON public.orderlogs USING btree (action);


--
-- TOC entry 5367 (class 1259 OID 17682)
-- Name: idx_orderlogs_orderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orderlogs_orderid ON public.orderlogs USING btree (orderid);


--
-- TOC entry 5319 (class 1259 OID 17494)
-- Name: idx_orders_ordercode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_ordercode ON public.orders USING btree (ordercode);


--
-- TOC entry 5320 (class 1259 OID 17495)
-- Name: idx_orders_ordertype; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_ordertype ON public.orders USING btree (ordertype);


--
-- TOC entry 5321 (class 1259 OID 17496)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 5342 (class 1259 OID 17599)
-- Name: idx_payments_orderid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_orderid ON public.payments USING btree (orderid);


--
-- TOC entry 5343 (class 1259 OID 17600)
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- TOC entry 5239 (class 1259 OID 17145)
-- Name: idx_productcategories_categoryname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productcategories_categoryname ON public.productcategories USING btree (categoryname);


--
-- TOC entry 5266 (class 1259 OID 17254)
-- Name: idx_productimages_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productimages_productid ON public.productimages USING btree (productid);


--
-- TOC entry 5312 (class 1259 OID 17444)
-- Name: idx_productlots_lotnumber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productlots_lotnumber ON public.productlots USING btree (lotnumber);


--
-- TOC entry 5313 (class 1259 OID 17443)
-- Name: idx_productlots_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productlots_productid ON public.productlots USING btree (productid);


--
-- TOC entry 5314 (class 1259 OID 17445)
-- Name: idx_productlots_warehouseid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productlots_warehouseid ON public.productlots USING btree (warehouseid);


--
-- TOC entry 5307 (class 1259 OID 17430)
-- Name: idx_productprices_pricetype; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productprices_pricetype ON public.productprices USING btree (pricetype);


--
-- TOC entry 5308 (class 1259 OID 17429)
-- Name: idx_productprices_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productprices_productid ON public.productprices USING btree (productid);


--
-- TOC entry 5309 (class 1259 OID 17475)
-- Name: idx_productprices_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_productprices_unique ON public.productprices USING btree (productid, pricetype, effectivefrom);


--
-- TOC entry 5260 (class 1259 OID 17197)
-- Name: idx_products_productcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_productcode ON public.products USING btree (productcode);


--
-- TOC entry 5261 (class 1259 OID 17196)
-- Name: idx_products_productname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_productname ON public.products USING btree (productname);


--
-- TOC entry 5275 (class 1259 OID 17290)
-- Name: idx_productstocks_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productstocks_productid ON public.productstocks USING btree (productid);


--
-- TOC entry 5276 (class 1259 OID 17291)
-- Name: idx_productstocks_warehouseid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productstocks_warehouseid ON public.productstocks USING btree (warehouseid);


--
-- TOC entry 5301 (class 1259 OID 17416)
-- Name: idx_productsupplier_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productsupplier_productid ON public.productsuppliers USING btree (productid);


--
-- TOC entry 5302 (class 1259 OID 17417)
-- Name: idx_productsupplier_supplierid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productsupplier_supplierid ON public.productsuppliers USING btree (supplierid);


--
-- TOC entry 5381 (class 1259 OID 17783)
-- Name: idx_reportdetails_metrictype; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reportdetails_metrictype ON public.reportdetails USING btree (metrictype);


--
-- TOC entry 5382 (class 1259 OID 17782)
-- Name: idx_reportdetails_reftype; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reportdetails_reftype ON public.reportdetails USING btree (reftype, refid);


--
-- TOC entry 5383 (class 1259 OID 17781)
-- Name: idx_reportdetails_reportid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reportdetails_reportid ON public.reportdetails USING btree (reportid);


--
-- TOC entry 5386 (class 1259 OID 17794)
-- Name: idx_reportlogs_reportid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reportlogs_reportid ON public.reportlogs USING btree (reportid);


--
-- TOC entry 5376 (class 1259 OID 17750)
-- Name: idx_reportsummaries_date_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reportsummaries_date_type ON public.reportsummaries USING btree (reportdate, reporttype, reportperiod);


--
-- TOC entry 5330 (class 1259 OID 17553)
-- Name: idx_shippingproviders_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shippingproviders_code ON public.shippingproviders USING btree (providercode);


--
-- TOC entry 5286 (class 1259 OID 17316)
-- Name: idx_stockadjustments_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stockadjustments_productid ON public.stockadjustments USING btree (productid);


--
-- TOC entry 5287 (class 1259 OID 17317)
-- Name: idx_stockadjustments_warehouseid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stockadjustments_warehouseid ON public.stockadjustments USING btree (warehouseid);


--
-- TOC entry 5226 (class 1259 OID 17079)
-- Name: idx_suppliercategories_categoryname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliercategories_categoryname ON public.suppliercategories USING btree (categoryname);


--
-- TOC entry 5231 (class 1259 OID 17115)
-- Name: idx_suppliers_suppliercode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_suppliercode ON public.suppliers USING btree (suppliercode);


--
-- TOC entry 5232 (class 1259 OID 17114)
-- Name: idx_suppliers_suppliername; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_suppliername ON public.suppliers USING btree (suppliername);


--
-- TOC entry 5290 (class 1259 OID 17331)
-- Name: idx_transferrequests_fromwarehouse; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transferrequests_fromwarehouse ON public.transferrequests USING btree (fromwarehouseid);


--
-- TOC entry 5291 (class 1259 OID 17330)
-- Name: idx_transferrequests_productid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transferrequests_productid ON public.transferrequests USING btree (productid);


--
-- TOC entry 5292 (class 1259 OID 17333)
-- Name: idx_transferrequests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transferrequests_status ON public.transferrequests USING btree (status);


--
-- TOC entry 5293 (class 1259 OID 17332)
-- Name: idx_transferrequests_towarehouse; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transferrequests_towarehouse ON public.transferrequests USING btree (towarehouseid);


--
-- TOC entry 5254 (class 1259 OID 17178)
-- Name: idx_unitconversions_fromunit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unitconversions_fromunit ON public.unitconversions USING btree (fromunitid);


--
-- TOC entry 5255 (class 1259 OID 17179)
-- Name: idx_unitconversions_tounit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unitconversions_tounit ON public.unitconversions USING btree (tounitid);


--
-- TOC entry 5246 (class 1259 OID 17165)
-- Name: idx_units_unitcode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_unitcode ON public.units USING btree (unitcode);


--
-- TOC entry 5247 (class 1259 OID 17164)
-- Name: idx_units_unitname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_unitname ON public.units USING btree (unitname);


--
-- TOC entry 5179 (class 1259 OID 16688)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5180 (class 1259 OID 16689)
-- Name: idx_users_usercode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_usercode ON public.users USING btree (usercode);


--
-- TOC entry 5181 (class 1259 OID 16687)
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- TOC entry 5269 (class 1259 OID 17275)
-- Name: idx_warehouses_warehousecode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warehouses_warehousecode ON public.warehouses USING btree (warehousecode);


--
-- TOC entry 5270 (class 1259 OID 17276)
-- Name: idx_warehouses_warehousename; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warehouses_warehousename ON public.warehouses USING btree (warehousename);


--
-- TOC entry 5476 (class 2620 OID 17400)
-- Name: inventorytransactions trg_check_approval_before_insert_inventorytransactions; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_approval_before_insert_inventorytransactions BEFORE INSERT ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_check_approval_before_insert_inventorytransactions();


--
-- TOC entry 5477 (class 2620 OID 17402)
-- Name: inventorytransactions trg_complete_transfer_request; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_complete_transfer_request AFTER INSERT ON public.inventorytransactions FOR EACH ROW EXECUTE FUNCTION public.trg_complete_transfer_request();


--
-- TOC entry 5462 (class 2620 OID 17017)
-- Name: customerlevels trg_customerlevels_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customerlevels_updatedat BEFORE UPDATE ON public.customerlevels FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5464 (class 2620 OID 17023)
-- Name: customerpointhistory trg_customerpointhistory_before_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customerpointhistory_before_insert BEFORE INSERT ON public.customerpointhistory FOR EACH ROW EXECUTE FUNCTION public.trg_customerpointhistory_set_points();


--
-- TOC entry 5463 (class 2620 OID 17022)
-- Name: customers trg_customers_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customers_updatedat BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5488 (class 2620 OID 17693)
-- Name: deliveries trg_deliveries_update_order_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_deliveries_update_order_status AFTER UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.trg_update_order_status();


--
-- TOC entry 5489 (class 2620 OID 17690)
-- Name: deliveries trg_deliveries_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_deliveries_updatedat BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5459 (class 2620 OID 16836)
-- Name: departments trg_departments_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_departments_updatedat BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5485 (class 2620 OID 17516)
-- Name: orderdetails trg_orderdetails_calc_totalamount; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orderdetails_calc_totalamount BEFORE INSERT OR UPDATE ON public.orderdetails FOR EACH ROW EXECUTE FUNCTION public.trg_calc_orderdetails_totalamount();


--
-- TOC entry 5486 (class 2620 OID 17518)
-- Name: orderdetails trg_orderdetails_update_orders_totalamount; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orderdetails_update_orders_totalamount AFTER INSERT OR DELETE OR UPDATE ON public.orderdetails FOR EACH ROW EXECUTE FUNCTION public.trg_update_orders_totalamount();


--
-- TOC entry 5487 (class 2620 OID 17514)
-- Name: orderdetails trg_orderdetails_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orderdetails_updatedat BEFORE UPDATE ON public.orderdetails FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5482 (class 2620 OID 17696)
-- Name: orders trg_orders_create_invoice; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orders_create_invoice AFTER UPDATE ON public.orders FOR EACH ROW WHEN (((new.status)::text = 'Completed'::text)) EXECUTE FUNCTION public.trg_create_invoice_when_order_completed();


--
-- TOC entry 5483 (class 2620 OID 17706)
-- Name: orders trg_orders_log_status_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orders_log_status_change AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.trg_log_order_status_change();


--
-- TOC entry 5484 (class 2620 OID 17513)
-- Name: orders trg_orders_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orders_updatedat BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5490 (class 2620 OID 17694)
-- Name: payments trg_payments_update_order_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_update_order_status AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.trg_update_order_status();


--
-- TOC entry 5491 (class 2620 OID 17691)
-- Name: payments trg_payments_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_updatedat BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5461 (class 2620 OID 16839)
-- Name: permissions trg_permissions_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_permissions_updatedat BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5469 (class 2620 OID 17146)
-- Name: productcategories trg_productcategories_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productcategories_updatedat BEFORE UPDATE ON public.productcategories FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5473 (class 2620 OID 17255)
-- Name: productimages trg_productimages_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productimages_updatedat BEFORE UPDATE ON public.productimages FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5480 (class 2620 OID 17477)
-- Name: productlots trg_productlots_inactive; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productlots_inactive BEFORE UPDATE ON public.productlots FOR EACH ROW EXECUTE FUNCTION public.trg_productlots_inactive_when_empty();


--
-- TOC entry 5481 (class 2620 OID 17472)
-- Name: productlots trg_productlots_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productlots_updatedat BEFORE UPDATE ON public.productlots FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5472 (class 2620 OID 17200)
-- Name: products trg_products_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_products_updatedat BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5475 (class 2620 OID 17335)
-- Name: productstocks trg_productstocks_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productstocks_updatedat BEFORE UPDATE ON public.productstocks FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5478 (class 2620 OID 17474)
-- Name: productsuppliers trg_productsupplier_only_one_main; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productsupplier_only_one_main AFTER INSERT OR UPDATE ON public.productsuppliers FOR EACH ROW EXECUTE FUNCTION public.trg_only_one_main_supplier();


--
-- TOC entry 5479 (class 2620 OID 17471)
-- Name: productsuppliers trg_productsupplier_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_productsupplier_updatedat BEFORE UPDATE ON public.productsuppliers FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5494 (class 2620 OID 17797)
-- Name: reportdetails trg_reportdetails_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reportdetails_updatedat BEFORE UPDATE ON public.reportdetails FOR EACH ROW EXECUTE FUNCTION public.trg_update_updatedat_report();


--
-- TOC entry 5492 (class 2620 OID 17799)
-- Name: reportsummaries trg_reportsummaries_log; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reportsummaries_log AFTER INSERT OR DELETE OR UPDATE ON public.reportsummaries FOR EACH ROW EXECUTE FUNCTION public.trg_log_report_summary();


--
-- TOC entry 5493 (class 2620 OID 17796)
-- Name: reportsummaries trg_reportsummaries_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reportsummaries_updatedat BEFORE UPDATE ON public.reportsummaries FOR EACH ROW EXECUTE FUNCTION public.trg_update_updatedat_report();


--
-- TOC entry 5460 (class 2620 OID 16838)
-- Name: roles trg_roles_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_roles_updatedat BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5467 (class 2620 OID 17117)
-- Name: suppliercategories trg_suppliercategories_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_suppliercategories_updatedat BEFORE UPDATE ON public.suppliercategories FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5468 (class 2620 OID 17116)
-- Name: suppliers trg_suppliers_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_suppliers_updatedat BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5471 (class 2620 OID 17199)
-- Name: unitconversions trg_unitconversions_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_unitconversions_updatedat BEFORE UPDATE ON public.unitconversions FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5470 (class 2620 OID 17198)
-- Name: units trg_units_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_units_updatedat BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5457 (class 2620 OID 16841)
-- Name: users trg_users_change_history; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_change_history AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.log_user_change_history();


--
-- TOC entry 5458 (class 2620 OID 16837)
-- Name: users trg_users_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updatedat BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5465 (class 2620 OID 17052)
-- Name: vouchers trg_vouchers_before_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vouchers_before_insert BEFORE INSERT ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.trg_exchange_points_for_voucher();


--
-- TOC entry 5466 (class 2620 OID 17054)
-- Name: vouchers trg_vouchers_expire; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vouchers_expire BEFORE INSERT OR UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.trg_expire_voucher();


--
-- TOC entry 5474 (class 2620 OID 17334)
-- Name: warehouses trg_warehouses_updatedat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_warehouses_updatedat BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updatedat_column();


--
-- TOC entry 5451 (class 2606 OID 17731)
-- Name: allowedmetrics allowedmetrics_metrictype_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowedmetrics
    ADD CONSTRAINT allowedmetrics_metrictype_fkey FOREIGN KEY (metrictype) REFERENCES public.metrictypes(metrictype);


--
-- TOC entry 5452 (class 2606 OID 17726)
-- Name: allowedmetrics allowedmetrics_reftype_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowedmetrics
    ADD CONSTRAINT allowedmetrics_reftype_fkey FOREIGN KEY (reftype) REFERENCES public.reportreftypes(reftype);


--
-- TOC entry 5453 (class 2606 OID 17776)
-- Name: reportdetails fk_allowedmetrics; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportdetails
    ADD CONSTRAINT fk_allowedmetrics FOREIGN KEY (reftype, metrictype) REFERENCES public.allowedmetrics(reftype, metrictype);


--
-- TOC entry 5403 (class 2606 OID 16982)
-- Name: customerlevels fk_customerlevels_createdby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerlevels
    ADD CONSTRAINT fk_customerlevels_createdby FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5404 (class 2606 OID 16987)
-- Name: customerlevels fk_customerlevels_updatedby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerlevels
    ADD CONSTRAINT fk_customerlevels_updatedby FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5408 (class 2606 OID 17012)
-- Name: customerpointhistory fk_customerpointhistory_createdby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerpointhistory
    ADD CONSTRAINT fk_customerpointhistory_createdby FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5409 (class 2606 OID 17007)
-- Name: customerpointhistory fk_customerpointhistory_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customerpointhistory
    ADD CONSTRAINT fk_customerpointhistory_customer FOREIGN KEY (customerid) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 5405 (class 2606 OID 16997)
-- Name: customers fk_customers_createdby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_createdby FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5406 (class 2606 OID 16992)
-- Name: customers fk_customers_customerlevel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_customerlevel FOREIGN KEY (customerlevelid) REFERENCES public.customerlevels(id) ON DELETE SET NULL;


--
-- TOC entry 5407 (class 2606 OID 17002)
-- Name: customers fk_customers_updatedby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_updatedby FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5444 (class 2606 OID 17574)
-- Name: deliveries fk_deliveries_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT fk_deliveries_order FOREIGN KEY (orderid) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5445 (class 2606 OID 17579)
-- Name: deliveries fk_deliveries_shippingprovider; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT fk_deliveries_shippingprovider FOREIGN KEY (shippingproviderid) REFERENCES public.shippingproviders(id) ON DELETE SET NULL;


--
-- TOC entry 5391 (class 2606 OID 16805)
-- Name: departments fk_departments_createdby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_departments_createdby FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5427 (class 2606 OID 17346)
-- Name: inventorytransactions fk_inventorytransactions_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventorytransactions
    ADD CONSTRAINT fk_inventorytransactions_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5428 (class 2606 OID 17356)
-- Name: inventorytransactions fk_inventorytransactions_unit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventorytransactions
    ADD CONSTRAINT fk_inventorytransactions_unit FOREIGN KEY (unitid) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- TOC entry 5429 (class 2606 OID 17351)
-- Name: inventorytransactions fk_inventorytransactions_warehouse; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventorytransactions
    ADD CONSTRAINT fk_inventorytransactions_warehouse FOREIGN KEY (warehouseid) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- TOC entry 5449 (class 2606 OID 17665)
-- Name: invoices fk_invoices_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_invoices_order FOREIGN KEY (orderid) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5447 (class 2606 OID 17642)
-- Name: orderapprovals fk_orderapprovals_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderapprovals
    ADD CONSTRAINT fk_orderapprovals_order FOREIGN KEY (orderid) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5441 (class 2606 OID 17524)
-- Name: orderdetails fk_orderdetails_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderdetails
    ADD CONSTRAINT fk_orderdetails_order FOREIGN KEY (orderid) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5442 (class 2606 OID 17529)
-- Name: orderdetails fk_orderdetails_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderdetails
    ADD CONSTRAINT fk_orderdetails_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5443 (class 2606 OID 17534)
-- Name: orderdetails fk_orderdetails_unit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderdetails
    ADD CONSTRAINT fk_orderdetails_unit FOREIGN KEY (unitid) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- TOC entry 5450 (class 2606 OID 17684)
-- Name: orderlogs fk_orderlogs_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderlogs
    ADD CONSTRAINT fk_orderlogs_order FOREIGN KEY (orderid) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5440 (class 2606 OID 17519)
-- Name: orders fk_orders_supplier; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_supplier FOREIGN KEY (supplierid) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- TOC entry 5446 (class 2606 OID 17601)
-- Name: payments fk_payments_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_order FOREIGN KEY (orderid) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5393 (class 2606 OID 16815)
-- Name: permissions fk_permissions_createdby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk_permissions_createdby FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5424 (class 2606 OID 17256)
-- Name: productimages fk_productimages_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productimages
    ADD CONSTRAINT fk_productimages_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5438 (class 2606 OID 17461)
-- Name: productlots fk_productlots_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productlots
    ADD CONSTRAINT fk_productlots_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5439 (class 2606 OID 17466)
-- Name: productlots fk_productlots_warehouse; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productlots
    ADD CONSTRAINT fk_productlots_warehouse FOREIGN KEY (warehouseid) REFERENCES public.warehouses(id) ON DELETE SET NULL;


--
-- TOC entry 5437 (class 2606 OID 17456)
-- Name: productprices fk_productprices_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productprices
    ADD CONSTRAINT fk_productprices_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5422 (class 2606 OID 17233)
-- Name: products fk_products_baseunit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_baseunit FOREIGN KEY (baseunitid) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- TOC entry 5423 (class 2606 OID 17216)
-- Name: products fk_products_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_category FOREIGN KEY (categoryid) REFERENCES public.productcategories(id) ON DELETE SET NULL;


--
-- TOC entry 5425 (class 2606 OID 17336)
-- Name: productstocks fk_productstocks_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productstocks
    ADD CONSTRAINT fk_productstocks_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5426 (class 2606 OID 17341)
-- Name: productstocks fk_productstocks_warehouse; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productstocks
    ADD CONSTRAINT fk_productstocks_warehouse FOREIGN KEY (warehouseid) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- TOC entry 5435 (class 2606 OID 17446)
-- Name: productsuppliers fk_productsupplier_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsuppliers
    ADD CONSTRAINT fk_productsupplier_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5436 (class 2606 OID 17451)
-- Name: productsuppliers fk_productsupplier_supplier; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productsuppliers
    ADD CONSTRAINT fk_productsupplier_supplier FOREIGN KEY (supplierid) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 5392 (class 2606 OID 16810)
-- Name: roles fk_roles_createdby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fk_roles_createdby FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5430 (class 2606 OID 17361)
-- Name: stockadjustments fk_stockadjustments_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stockadjustments
    ADD CONSTRAINT fk_stockadjustments_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5431 (class 2606 OID 17366)
-- Name: stockadjustments fk_stockadjustments_warehouse; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stockadjustments
    ADD CONSTRAINT fk_stockadjustments_warehouse FOREIGN KEY (warehouseid) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- TOC entry 5432 (class 2606 OID 17376)
-- Name: transferrequests fk_transferrequests_fromwarehouse; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferrequests
    ADD CONSTRAINT fk_transferrequests_fromwarehouse FOREIGN KEY (fromwarehouseid) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- TOC entry 5433 (class 2606 OID 17371)
-- Name: transferrequests fk_transferrequests_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferrequests
    ADD CONSTRAINT fk_transferrequests_product FOREIGN KEY (productid) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5434 (class 2606 OID 17381)
-- Name: transferrequests fk_transferrequests_towarehouse; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferrequests
    ADD CONSTRAINT fk_transferrequests_towarehouse FOREIGN KEY (towarehouseid) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- TOC entry 5420 (class 2606 OID 17223)
-- Name: unitconversions fk_unitconversions_fromunit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unitconversions
    ADD CONSTRAINT fk_unitconversions_fromunit FOREIGN KEY (fromunitid) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- TOC entry 5421 (class 2606 OID 17228)
-- Name: unitconversions fk_unitconversions_tounit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unitconversions
    ADD CONSTRAINT fk_unitconversions_tounit FOREIGN KEY (tounitid) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- TOC entry 5400 (class 2606 OID 16820)
-- Name: useractivitylogs fk_useractivitylogs_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useractivitylogs
    ADD CONSTRAINT fk_useractivitylogs_user FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5401 (class 2606 OID 16830)
-- Name: userchangehistory fk_userchangehistory_changedby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userchangehistory
    ADD CONSTRAINT fk_userchangehistory_changedby FOREIGN KEY (changedby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5402 (class 2606 OID 16825)
-- Name: userchangehistory fk_userchangehistory_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userchangehistory
    ADD CONSTRAINT fk_userchangehistory_user FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5389 (class 2606 OID 16795)
-- Name: users fk_users_createdby; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_createdby FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5390 (class 2606 OID 16800)
-- Name: users fk_users_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_department FOREIGN KEY (departmentid) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- TOC entry 5448 (class 2606 OID 17633)
-- Name: orderapprovals orderapprovals_flowid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orderapprovals
    ADD CONSTRAINT orderapprovals_flowid_fkey FOREIGN KEY (flowid) REFERENCES public.approvalflows(id) ON DELETE SET NULL;


--
-- TOC entry 5418 (class 2606 OID 17135)
-- Name: productcategories productcategories_createdby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcategories
    ADD CONSTRAINT productcategories_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5419 (class 2606 OID 17140)
-- Name: productcategories productcategories_updatedby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productcategories
    ADD CONSTRAINT productcategories_updatedby_fkey FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5454 (class 2606 OID 17771)
-- Name: reportdetails reportdetails_metrictype_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportdetails
    ADD CONSTRAINT reportdetails_metrictype_fkey FOREIGN KEY (metrictype) REFERENCES public.metrictypes(metrictype);


--
-- TOC entry 5455 (class 2606 OID 17766)
-- Name: reportdetails reportdetails_reftype_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportdetails
    ADD CONSTRAINT reportdetails_reftype_fkey FOREIGN KEY (reftype) REFERENCES public.reportreftypes(reftype);


--
-- TOC entry 5456 (class 2606 OID 17761)
-- Name: reportdetails reportdetails_reportid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportdetails
    ADD CONSTRAINT reportdetails_reportid_fkey FOREIGN KEY (reportid) REFERENCES public.reportsummaries(id) ON DELETE CASCADE;


--
-- TOC entry 5396 (class 2606 OID 16753)
-- Name: rolepermissions rolepermissions_permissionid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_permissionid_fkey FOREIGN KEY (permissionid) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5397 (class 2606 OID 16748)
-- Name: rolepermissions rolepermissions_roleid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_roleid_fkey FOREIGN KEY (roleid) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5413 (class 2606 OID 17069)
-- Name: suppliercategories suppliercategories_createdby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliercategories
    ADD CONSTRAINT suppliercategories_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5414 (class 2606 OID 17074)
-- Name: suppliercategories suppliercategories_updatedby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliercategories
    ADD CONSTRAINT suppliercategories_updatedby_fkey FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5415 (class 2606 OID 17099)
-- Name: suppliers suppliers_categoryid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_categoryid_fkey FOREIGN KEY (categoryid) REFERENCES public.suppliercategories(id) ON DELETE SET NULL;


--
-- TOC entry 5416 (class 2606 OID 17104)
-- Name: suppliers suppliers_createdby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5417 (class 2606 OID 17109)
-- Name: suppliers suppliers_updatedby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_updatedby_fkey FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5398 (class 2606 OID 16768)
-- Name: userpermissions userpermissions_permissionid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userpermissions
    ADD CONSTRAINT userpermissions_permissionid_fkey FOREIGN KEY (permissionid) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5399 (class 2606 OID 16763)
-- Name: userpermissions userpermissions_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userpermissions
    ADD CONSTRAINT userpermissions_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5394 (class 2606 OID 16738)
-- Name: userroles userroles_roleid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_roleid_fkey FOREIGN KEY (roleid) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5395 (class 2606 OID 16733)
-- Name: userroles userroles_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userroles
    ADD CONSTRAINT userroles_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5410 (class 2606 OID 17041)
-- Name: vouchers vouchers_createdby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5411 (class 2606 OID 17036)
-- Name: vouchers vouchers_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 5412 (class 2606 OID 17046)
-- Name: vouchers vouchers_updatedby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_updatedby_fkey FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2025-05-26 11:30:22

--
-- PostgreSQL database dump complete
--

