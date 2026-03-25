CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "created_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_in" TIMESTAMP(3),
    "name" VARCHAR(255) NOT NULL,
    "federal_registration" VARCHAR(18) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "created_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_in" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_in" TIMESTAMP(3),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "profile_image" VARCHAR(255),
    "profile_id" TEXT NOT NULL,
    "company_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_password_reset_request" (
    "reset_token" TEXT NOT NULL,
    "expires_in" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "request_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_password_reset_request_pkey" PRIMARY KEY ("reset_token")
);

CREATE TABLE "profile_permissions" (
    "id" TEXT NOT NULL,
    "created_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_in" TIMESTAMP(3),
    "profile_id" TEXT NOT NULL,
    "menu_id" TEXT,
    "controller" VARCHAR(100) NOT NULL,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_find" BOOLEAN NOT NULL DEFAULT false,
    "can_find_all" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profile_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "created_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_in" TIMESTAMP(3),
    "action" VARCHAR(255) NOT NULL,
    "device_type" VARCHAR(10) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "section_name" VARCHAR(50),
    "tooltip" VARCHAR(255),
    "type" VARCHAR(30) NOT NULL DEFAULT 'ROOT_MENU',

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "companies_federal_registration_key" ON "companies"("federal_registration");

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "profile_permissions_profile_id_controller_key" ON "profile_permissions"("profile_id", "controller");

CREATE UNIQUE INDEX "profile_permissions_profile_id_menu_id_key" ON "profile_permissions"("profile_id", "menu_id");

ALTER TABLE "users" ADD CONSTRAINT "users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_password_reset_request" ADD CONSTRAINT "user_password_reset_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "profile_permissions" ADD CONSTRAINT "profile_permissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "profile_permissions" ADD CONSTRAINT "profile_permissions_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
