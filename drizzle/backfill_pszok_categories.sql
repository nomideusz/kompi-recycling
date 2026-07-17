-- Statutory PSZOK acceptance list (ustawa o utrzymaniu czystości i porządku w gminach, art. 3 ust. 2 pkt 6): every municipal collection point must accept these waste streams, so tag every 'municipal' row with them. Idempotent: instr() guard skips rows already tagged.
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'car_battery') WHERE takeback_type = 'municipal' AND instr(categories_json, '"car_battery"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'oil') WHERE takeback_type = 'municipal' AND instr(categories_json, '"oil"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'tires') WHERE takeback_type = 'municipal' AND instr(categories_json, '"tires"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'chemicals') WHERE takeback_type = 'municipal' AND instr(categories_json, '"chemicals"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'meds') WHERE takeback_type = 'municipal' AND instr(categories_json, '"meds"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'bulky') WHERE takeback_type = 'municipal' AND instr(categories_json, '"bulky"') = 0;
UPDATE recycling_points SET categories_json = json_insert(categories_json, '$[#]', 'textiles') WHERE takeback_type = 'municipal' AND instr(categories_json, '"textiles"') = 0;
