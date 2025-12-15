<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Inventory;

class InventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'product_name' => 'Brake Pads',
                'category' => 'Brake Parts',
                'quantity' => 30,
                'price' => 2500,
                'stock_status' => 'In Stock',
                'description' => 'High-quality brake pads for motorcycles',
                'image_path' => '/images/inventory/brake_pads.png'
            ],
            [
                'product_name' => 'Hoses',
                'category' => 'Hoses Parts',
                'quantity' => 50,
                'price' => 1000,
                'stock_status' => 'In Stock',
                'description' => 'Durable hoses for various motorcycle parts',
                'image_path' => '/images/inventory/hoses.png'
            ],
            [
                'product_name' => 'Shock Absorber',
                'category' => 'Accessories Parts',
                'quantity' => 20,
                'price' => 5500,
                'stock_status' => 'In Stock',
                'description' => 'Premium shock absorbers for smooth rides',
                'image_path' => '/images/inventory/shock_absorber.png'
            ],
            [
                'product_name' => 'Engine Spare Parts',
                'category' => 'Engine Parts',
                'quantity' => 40,
                'price' => 8000,
                'stock_status' => 'In Stock',
                'description' => 'Essential engine spare parts',
                'image_path' => '/images/inventory/engine_spare.png'
            ],
            [
                'product_name' => 'Exhaust System',
                'category' => 'Engine Parts',
                'quantity' => 35,
                'price' => 7500,
                'stock_status' => 'In Stock',
                'description' => 'Performance exhaust system',
                'image_path' => '/images/inventory/exhaust_motor.png'
            ],
            [
                'product_name' => 'Side Mirror',
                'category' => 'Body Parts',
                'quantity' => 60,
                'price' => 1500,
                'stock_status' => 'In Stock',
                'description' => 'Durable side mirrors',
                'image_path' => '/images/inventory/motor_sidemirror.png'
            ],
            [
                'product_name' => 'Horn',
                'category' => 'Electrical Parts',
                'quantity' => 80,
                'price' => 800,
                'stock_status' => 'In Stock',
                'description' => 'Loud and clear motorcycle horn',
                'image_path' => '/images/inventory/horn.png'
            ],
            [
                'product_name' => 'Kick Starter',
                'category' => 'Transmission Parts',
                'quantity' => 25,
                'price' => 3000,
                'stock_status' => 'In Stock',
                'description' => 'Reliable kick starter mechanism',
                'image_path' => '/images/inventory/kick_starter.png'
            ],
            [
                'product_name' => 'Steering Bar',
                'category' => 'Body Parts',
                'quantity' => 40,
                'price' => 3500,
                'stock_status' => 'In Stock',
                'description' => 'Sturdy steering bar for better control',
                'image_path' => '/images/inventory/steering_bar.png'
            ],
            [
                'product_name' => 'Headlight Lamp',
                'category' => 'Electrical Parts',
                'quantity' => 45,
                'price' => 2800,
                'stock_status' => 'In Stock',
                'description' => 'Bright LED headlight lamp',
                'image_path' => '/images/inventory/heading_light.png'
            ],
            [
                'product_name' => 'Signal Light',
                'category' => 'Electrical Parts',
                'quantity' => 50,
                'price' => 1200,
                'stock_status' => 'In Stock',
                'description' => 'LED signal lights for better visibility',
                'image_path' => '/images/inventory/signal_light.png'
            ],
            [
                'product_name' => 'Tail Light',
                'category' => 'Electrical Parts',
                'quantity' => 30,
                'price' => 2000,
                'stock_status' => 'In Stock',
                'description' => 'High-visibility tail lights',
                'image_path' => '/images/inventory/tail_light.png'
            ],
            [
                'product_name' => 'Electrical Parts',
                'category' => 'Electrical Parts',
                'quantity' => 35,
                'price' => 4500,
                'stock_status' => 'In Stock',
                'description' => 'Complete electrical parts set',
                'image_path' => '/images/inventory/electrical_parts_motorparts.png'
            ],
            [
                'product_name' => 'Seat Cover',
                'category' => 'Accessories Parts',
                'quantity' => 40,
                'price' => 1800,
                'stock_status' => 'In Stock',
                'description' => 'Comfortable and stylish seat cover',
                'image_path' => '/images/inventory/seat_cover.png'
            ],
            [
                'product_name' => 'Motorcycle Body Cover',
                'category' => 'Body Parts',
                'quantity' => 30,
                'price' => 2500,
                'stock_status' => 'In Stock',
                'description' => 'Protective body cover for motorcycles',
                'image_path' => '/images/inventory/motorcycle_body_cover.png'
            ],
            [
                'product_name' => 'Bearing',
                'category' => 'Transmission Parts',
                'quantity' => 20,
                'price' => 1200,
                'stock_status' => 'In Stock',
                'description' => 'High-quality bearings for smooth operation',
                'image_path' => '/images/inventory/bearing.png'
            ],
            [
                'product_name' => 'Volts',
                'category' => 'Electrical Parts',
                'quantity' => 60,
                'price' => 500,
                'stock_status' => 'In Stock',
                'description' => 'Voltage regulator for electrical system',
                'image_path' => '/images/inventory/voltage.png'
            ],
            [
                'product_name' => 'Sprockets',
                'category' => 'Transmission Parts',
                'quantity' => 35,
                'price' => 3000,
                'stock_status' => 'In Stock',
                'description' => 'Durable sprockets for chain drive',
                'image_path' => '/images/inventory/sprockets.png'
            ],
            [
                'product_name' => 'Interior Tube',
                'category' => 'Accessories Parts',
                'quantity' => 40,
                'price' => 1500,
                'stock_status' => 'In Stock',
                'description' => 'Quality interior tubes for various parts',
                'image_path' => '/images/inventory/interior_tube.png'
            ],
            [
                'product_name' => 'Light Bulbs',
                'category' => 'Electrical Parts',
                'quantity' => 50,
                'price' => 400,
                'stock_status' => 'In Stock',
                'description' => 'Bright and long-lasting light bulbs',
                'image_path' => '/images/inventory/light_bulb.png'
            ],
            [
                'product_name' => 'Chain',
                'category' => 'Transmission Parts',
                'quantity' => 45,
                'price' => 2500,
                'stock_status' => 'In Stock',
                'description' => 'Heavy-duty motorcycle chain',
                'image_path' => '/images/inventory/chain.png'
            ],
            [
                'product_name' => 'Batteries',
                'category' => 'Electrical Parts',
                'quantity' => 25,
                'price' => 4000,
                'stock_status' => 'In Stock',
                'description' => 'High-performance motorcycle batteries',
                'image_path' => '/images/inventory/batteries.png'
            ],
            [
                'product_name' => 'Spark Plugs',
                'category' => 'Electrical Parts',
                'quantity' => 55,
                'price' => 800,
                'stock_status' => 'In Stock',
                'description' => 'Quality spark plugs for better ignition',
                'image_path' => '/images/inventory/spark_plug.png'
            ],
            [
                'product_name' => 'Oil Seals',
                'category' => 'Engine Parts',
                'quantity' => 30,
                'price' => 1000,
                'stock_status' => 'In Stock',
                'description' => 'Premium oil seals for engine protection',
                'image_path' => '/images/inventory/oil_seals.png'
            ],
            [
                'product_name' => 'Gaskets',
                'category' => 'Engine Parts',
                'quantity' => 25,
                'price' => 1200,
                'stock_status' => 'In Stock',
                'description' => 'High-quality engine gaskets',
                'image_path' => '/images/inventory/gaskets.png'
            ],
            [
                'product_name' => 'Carburetor',
                'category' => 'Engine Parts',
                'quantity' => 15,
                'price' => 6500,
                'stock_status' => 'In Stock',
                'description' => 'Performance carburetor for better fuel efficiency',
                'image_path' => '/images/inventory/carburetor_motor.png'
            ],
            [
                'product_name' => 'Fuel Tank',
                'category' => 'Engine Parts',
                'quantity' => 10,
                'price' => 8000,
                'stock_status' => 'In Stock',
                'description' => 'Durable fuel tank with large capacity',
                'image_path' => '/images/inventory/fuel_tank.png'
            ],
            [
                'product_name' => 'Shock',
                'category' => 'Accessories Parts',
                'quantity' => 20,
                'price' => 5500,
                'stock_status' => 'In Stock',
                'description' => 'Premium shock absorbers for comfort',
                'image_path' => '/images/inventory/shock.png'
            ],
            [
                'product_name' => 'Lubricants',
                'category' => 'Accessories Parts',
                'quantity' => 70,
                'price' => 900,
                'stock_status' => 'In Stock',
                'description' => 'High-quality motorcycle lubricants',
                'image_path' => '/images/inventory/lubricants.png'
            ],
            [
                'product_name' => 'Brake Labels',
                'category' => 'Brake Parts',
                'quantity' => 40,
                'price' => 1300,
                'stock_status' => 'In Stock',
                'description' => 'Safety brake labels and indicators',
                'image_path' => '/images/inventory/brake_labels.png'
            ]
        ];

        foreach ($products as $product) {
            Inventory::create($product);
        }
    }
}
