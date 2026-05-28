CREATE TABLE `account_move_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`move_id` integer,
	`product_id` integer,
	`name` text,
	`quantity` real DEFAULT 0,
	`price_unit` real DEFAULT 0,
	`price_subtotal` real DEFAULT 0,
	`discount` real DEFAULT 0,
	`x_delivery_time` text,
	FOREIGN KEY (`move_id`) REFERENCES `account_moves`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `account_moves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`move_type` text DEFAULT 'out_invoice',
	`state` text DEFAULT 'draft',
	`partner_id` integer,
	`invoice_date` text,
	`invoice_date_due` text,
	`amount_untaxed` real DEFAULT 0,
	`amount_tax` real DEFAULT 0,
	`amount_total` real DEFAULT 0,
	`payment_state` text,
	`narration` text,
	`invoice_origin` text,
	`invoice_payment_term_id` integer,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`street` text,
	`street2` text,
	`city` text,
	`state_id` integer,
	`zip` text,
	`country_id` integer,
	`vat` text,
	`x_tin` text,
	`is_company` integer DEFAULT false,
	`customer_rank` integer DEFAULT 0,
	`supplier_rank` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`default_code` text,
	`list_price` real DEFAULT 0,
	`standard_price` real DEFAULT 0,
	`type` text DEFAULT 'consu',
	`sale_ok` integer DEFAULT true,
	`purchase_ok` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `purchase_order_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`product_id` integer,
	`name` text,
	`product_qty` real DEFAULT 0,
	`price_unit` real DEFAULT 0,
	`price_subtotal` real DEFAULT 0,
	FOREIGN KEY (`order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`state` text DEFAULT 'draft',
	`partner_id` integer,
	`date_order` text,
	`date_planned` text,
	`amount_untaxed` real DEFAULT 0,
	`amount_tax` real DEFAULT 0,
	`amount_total` real DEFAULT 0,
	`notes` text,
	`origin` text,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sale_order_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer,
	`product_id` integer,
	`name` text,
	`product_uom_qty` real DEFAULT 0,
	`price_unit` real DEFAULT 0,
	`price_subtotal` real DEFAULT 0,
	`discount` real DEFAULT 0,
	`x_delivery_time` text,
	FOREIGN KEY (`order_id`) REFERENCES `sale_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sale_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`state` text DEFAULT 'draft',
	`partner_id` integer,
	`date_order` text,
	`validity_date` text,
	`amount_untaxed` real DEFAULT 0,
	`amount_tax` real DEFAULT 0,
	`amount_total` real DEFAULT 0,
	`note` text,
	`client_order_ref` text,
	`payment_term_id` integer,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sequences` (
	`name` text PRIMARY KEY NOT NULL,
	`current_value` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `stock_moves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`picking_id` integer,
	`product_id` integer,
	`name` text,
	`product_uom_qty` real DEFAULT 0,
	`quantity_done` real DEFAULT 0,
	FOREIGN KEY (`picking_id`) REFERENCES `stock_pickings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_pickings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`state` text DEFAULT 'draft',
	`partner_id` integer,
	`scheduled_date` text,
	`date_done` text,
	`origin` text,
	`picking_type_id` integer,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);