CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`vehicle_description` text DEFAULT '' NOT NULL,
	`service_type` text NOT NULL,
	`preferred_date` text NOT NULL,
	`notes` text,
	`user_id` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cart_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	`vehicle_label` text,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`guest_token` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `carts_user_id_unique` ON `carts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `carts_guest_token_unique` ON `carts` (`guest_token`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon_name` text NOT NULL,
	`default_bulb_type` text DEFAULT 'Universal' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL,
	`handled_at` integer
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`qty` integer NOT NULL,
	`vehicle_label` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`guest_email` text,
	`status` text DEFAULT 'PendingPayment' NOT NULL,
	`shipping_name` text NOT NULL,
	`shipping_email` text NOT NULL,
	`shipping_phone` text NOT NULL,
	`shipping_address` text NOT NULL,
	`shipping_apt` text,
	`shipping_city` text NOT NULL,
	`shipping_state` text NOT NULL,
	`shipping_zip` text NOT NULL,
	`shipping_country` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`shipping_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`payment_status` text DEFAULT 'Pending' NOT NULL,
	`provider_reference` text,
	`idempotency_key` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`provider` text DEFAULT 'mock' NOT NULL,
	`provider_payment_intent_id` text NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`idempotency_key` text,
	`failure_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_idempotency_key_unique` ON `payments` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `product_fitments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`year` integer,
	`make` text,
	`model` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_id` text NOT NULL,
	`price_cents` integer NOT NULL,
	`sale_price_cents` integer,
	`lumens` text DEFAULT '' NOT NULL,
	`warranty` text DEFAULT '' NOT NULL,
	`badge` text,
	`is_universal` integer DEFAULT false NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`image_url` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shipping_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`provider` text DEFAULT 'shippo' NOT NULL,
	`provider_transaction_id` text NOT NULL,
	`label_url` text NOT NULL,
	`tracking_number` text NOT NULL,
	`tracking_url_provider` text,
	`carrier` text NOT NULL,
	`service_level` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`weight_lb` real NOT NULL,
	`length_in` real NOT NULL,
	`width_in` real NOT NULL,
	`height_in` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vehicle_makes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_makes_name_unique` ON `vehicle_makes` (`name`);--> statement-breakpoint
CREATE TABLE `vehicle_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year_id` integer NOT NULL,
	`make_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`year_id`) REFERENCES `vehicle_years`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`make_id`) REFERENCES `vehicle_makes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_models_year_make_name` ON `vehicle_models` (`year_id`,`make_id`,`name`);--> statement-breakpoint
CREATE TABLE `vehicle_trims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `vehicle_models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicle_years` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_years_year_unique` ON `vehicle_years` (`year`);