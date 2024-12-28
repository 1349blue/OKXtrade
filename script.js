document.addEventListener('DOMContentLoaded', function () {
    // Variables to store API Key data
    let apiKey = '';
    let secretKey = '';
    let passphrase = '';
	
	//đăng ký Service Worker:
	if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
	}
	
    // Function to save API keys
    document.getElementById('saveApiKey').addEventListener('click', () => {
        apiKey = document.getElementById('apiKey').value;
        secretKey = document.getElementById('secretKey').value;
        passphrase = document.getElementById('passphrase').value;
        showAlert('API keys saved successfully!');
    });
	// Save data to a JSON file
	document.getElementById('saveAsApiKey').addEventListener('click', () => {
		const data = {
			apiKey: apiKey,
			secretKey: secretKey,
			passphrase: passphrase
		};

		const jsonData = JSON.stringify(data, null, 2);
		const blob = new Blob([jsonData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		// Create a temporary link to download the file
		const a = document.createElement('a');
		a.href = url;
		a.download = 'apiKeys_OKX.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(url); // Release the URL
		showAlert('Data saved to JSON file!');
	});

	// Load data from a JSON file
	document.getElementById('loadApiKey').addEventListener('click', () => {
		const fileInput = document.getElementById('fileInput');
		fileInput.click(); // Simulate a click to open the file selector

		fileInput.addEventListener('change', (event) => {
			const file = event.target.files[0];

			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const data = JSON.parse(e.target.result);
						document.getElementById('apiKey').value = data.apiKey || '';
						document.getElementById('secretKey').value = data.secretKey || '';
						document.getElementById('passphrase').value = data.passphrase || '';

						showAlert('Data loaded successfully!');
					} catch (err) {
						showAlert('Failed to load file. Please check the file format.');
					}
				};
				reader.readAsText(file);
			}
		});
	});


    // Function to fetch wallet information from OKX
    async function fetchWalletInfo() {
            const timestamp = new Date().toISOString();
            const path = '/api/v5/account/balance';
            const signature = await createSignature('GET', path, '', timestamp);

            const response = await fetch('https://www.okx.com' + path, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'OK-ACCESS-KEY': apiKey,
                    'OK-ACCESS-PASSPHRASE': passphrase,
                    'OK-ACCESS-TIMESTAMP': timestamp,
                    'OK-ACCESS-SIGN': signature,
                },
            });

            if (response.ok) {
                const data = await response.json();
                                displayWalletInfo(data);
            } else {
                const result = await response.json();
                showAlert("Error fetching wallet info: " + result.message);
            }
        }
	
	
    function displayWalletInfo(data) {
            const tableBody = document.getElementById("walletTable").getElementsByTagName("tbody")[0];
            tableBody.innerHTML = ""; // Clear existing rows

            const balances = data.data[0].details;
            balances.forEach((balance) => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${balance.ccy}</td>
                    <td>${balance.cashBal}</td>
					<td><button class="Order">Order</button></td>
					<td><button class="Condition">Condition</button></td>
                `;
            });
        }
	// Trigger fetching wallet info when needed
    document.getElementById('fetchWalletButton').addEventListener('click', fetchWalletInfo);
	// Function to fetch wallet information from OKX
    async function fetchAddAllOrder() {
            const rowsWallet = document.querySelectorAll('#walletTable tbody tr');
				rowsWallet.forEach(row => {
					//const row = e.target.closest('tr'); // Lấy hàng được click
					const table = document.getElementById('orderTable').getElementsByTagName('tbody')[0]; // Lấy bảng đích
					const newRow = table.insertRow(); // Thêm hàng mới

					// Kiểm tra và lấy giá trị từ các ô của hàng được click
					const cell1Value = row.cells[0]?.textContent.trim() || ''; // Lấy nội dung văn bản, loại bỏ khoảng trắng
					const cell2Value = row.cells[1]?.textContent.trim() || ''; // Lấy nội dung văn bản, loại bỏ khoảng trắng

					// Gán giá trị vào hàng mới
					newRow.innerHTML = `
						<td><input type="number" value="0"></td>
						<td><input type="text" value="${cell1Value}-USDT"></td>
						<td><input type="text" value="cash"></td>
						<td><input type="text" value="sell"></td>
						<td><input type="text" value="market"></td>
						<td><input type="number" value="${cell2Value}"></td>
						<td><button class="deleteRow">Del</button></td>
						<td><button class="activateOrder">Act</button></td>
					`;
				});
        }
	// Trigger fetching wallet info when needed
    document.getElementById('addAllOrder').addEventListener('click', fetchAddAllOrder);
	// Function to Condition rows in the order table
    document.getElementById('walletTable').addEventListener('click', (e) => {
    if (e.target.classList.contains('Condition')) {
        const row = e.target.closest('tr'); // Lấy hàng được click
        const table = document.getElementById('targetTable').getElementsByTagName('tbody')[0]; // Lấy bảng đích
        const newRow = table.insertRow(); // Thêm hàng mới

        // Lấy giá trị chuỗi từ ô đầu tiên
        const cell1Value = row.cells[0]?.textContent.trim() || ''; // Lấy nội dung văn bản, loại bỏ khoảng trắng


        // Gán giá trị vào hàng mới
        newRow.innerHTML = `
            <td><input type="number" value="-1"></td>
            <td><input type="text" value="${cell1Value}USDT"></td>
            <td><span class="currentPrice">0</span></td>
            <td><input type="text" value="<"></td>
            <td><input type="number" value="0"></td>
            <td><span class="percentChange">0</span></td>
            <td><button class="deleteRow">Del</button></td>
        `;
    }
	});
	

	// Function to Order rows in the order table
    document.getElementById('walletTable').addEventListener('click', (e) => {
    if (e.target.classList.contains('Order')) {
        const row = e.target.closest('tr'); // Lấy hàng được click
        const table = document.getElementById('orderTable').getElementsByTagName('tbody')[0]; // Lấy bảng đích
        const newRow = table.insertRow(); // Thêm hàng mới

        // Kiểm tra và lấy giá trị từ các ô của hàng được click
        const cell1Value = row.cells[0]?.textContent.trim() || ''; // Lấy nội dung văn bản, loại bỏ khoảng trắng
        const cell2Value = row.cells[1]?.textContent.trim() || ''; // Lấy nội dung văn bản, loại bỏ khoảng trắng

        // Gán giá trị vào hàng mới
        newRow.innerHTML = `
            <td><input type="number" value="0"></td>
            <td><input type="text" value="${cell1Value}-USDT"></td>
            <td><input type="text" value="cash"></td>
            <td><input type="text" value="sell"></td>
            <td><input type="text" value="market"></td>
            <td><input type="number" value="${cell2Value}"></td>
            <td><button class="deleteRow">Del</button></td>
            <td><button class="activateOrder">Act</button></td>
        `;
    }
	});
    // Function to add rows in the order table (Layout 2)
    document.getElementById('addOrderRow').addEventListener('click', () => {
        const table = document.getElementById('orderTable').getElementsByTagName('tbody')[0];
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td><input type="number" value="0"></td>
            <td><input type="text" value="BTC-USDT"></td>
            <td><input type="text" value="cash"></td>
            <td><input type="text" value="buy"></td>
            <td><input type="text" value="market"></td>
            <td><input type="number" value="0"></td>
            <td><button class="deleteRow">Del</button></td>
            <td><button class="activateOrder">Act</button></td>
        `;
    });
	// Save as lưu dữ liệu bảng Order
		document.getElementById('saveAsOrderTable').addEventListener('click', () => {
			const table = document.getElementById('orderTable');
			const tbody = table.querySelector('tbody');
			const tableData = [];

			// Duyệt qua tất cả các hàng trong bảng và lấy dữ liệu từ các ô input
			for (let row of tbody.rows) {
				const rowData = {};
				
				// Lấy giá trị từ các ô input trong mỗi hàng
				rowData['Order'] = row.cells[0].querySelector('input').value; // Lấy giá trị từ ô input Order
				rowData['instId'] = row.cells[1].querySelector('input').value; // Lấy giá trị từ ô input instId
				rowData['tdMode'] = row.cells[2].querySelector('input').value; // Lấy giá trị từ ô input tdMode
				rowData['Side'] = row.cells[3].querySelector('input').value; // Lấy giá trị từ ô input Side
				rowData['OrdType'] = row.cells[4].querySelector('input').value; // Lấy giá trị từ ô input OrdType
				rowData['Sz'] = row.cells[5].querySelector('input').value; // Lấy giá trị từ ô input Sz

				tableData.push(rowData); // Thêm dữ liệu hàng vào mảng
			}

			// Chuyển dữ liệu thành JSON
			const jsonData = JSON.stringify(tableData, null, 2);

			// Tạo một Blob từ dữ liệu JSON
			const blob = new Blob([jsonData], { type: 'application/json' });

			// Tạo URL tải về từ Blob
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'order_OKX.json'; // Tên tệp sẽ được tải về

			// Mô phỏng click vào liên kết để tải về tệp
			link.click();
		});


		// Load dữ liệu từ file JSON vào bảng
		document.getElementById('loadOrderTable').addEventListener('change', (event) => {
			const file = event.target.files[0];
			if (!file) {
				alert('No file selected!');
				return;
			}

			const reader = new FileReader();

			reader.onload = (e) => {
				try {
					const data = JSON.parse(e.target.result);

					// Kiểm tra dữ liệu có phải là mảng không
					if (!Array.isArray(data)) {
						alert('Invalid file format. Expected an array of objects.');
						return;
					}

					const tbody = document.getElementById('orderTable').getElementsByTagName('tbody')[0];
					tbody.innerHTML = ''; // Xóa dữ liệu hiện tại trong bảng

					// Duyệt qua từng hàng trong dữ liệu
					data.forEach((row) => {
						const newRow = tbody.insertRow();

						// Tạo các ô dữ liệu với input
						newRow.innerHTML = `
							<td><input type="number" value="${row.Order || 0}"></td>
							<td><input type="text" value="${row.instId || ''}"></td>
							<td><input type="text" value="${row.tdMode || ''}"></td>
							<td><input type="text" value="${row.Side || ''}"></td>
							<td><input type="text" value="${row.OrdType || ''}"></td>
							<td><input type="number" value="${row.Sz || 0}"></td>
							<td><button class="deleteRow">Del</button></td>
							<td><button class="activateOrder">Act</button></td>
						`;
					});
				} catch (err) {
					alert('Error loading file: ' + err.message);
				}
			};

			reader.readAsText(file);
		});

    // Function to delete rows in the order table
    document.getElementById('orderTable').addEventListener('click', (e) => {
        if (e.target.classList.contains('deleteRow')) {
            const row = e.target.closest('tr');
            row.remove();
        }
    });

	// xóa dữ liệu bảng
	document.getElementById('clearOrderTable').addEventListener('click', () => {
		document.getElementById('orderTable').querySelector('tbody').innerHTML = '';
	});
	document.getElementById('clearTargetTable').addEventListener('click', () => {
		document.getElementById('targetTable').querySelector('tbody').innerHTML = '';
	});
    // Function to activate all orders in the order table
    document.getElementById('actAll').addEventListener('click', () => {
        const rows = document.querySelectorAll('#orderTable tbody tr');
        rows.forEach((row, index) => {
            setTimeout(() => {
                row.querySelector('.activateOrder').click();  // Click the activate button with delay
            }, index * 300);  // Add a 300ms delay between activations
        });
    });

    // Function to handle activating an order
    document.getElementById('orderTable').addEventListener('click', async (e) => {
        if (e.target.classList.contains('activateOrder')) {
            const row = e.target.closest('tr');
            const orderDetails = {
                instId: row.cells[1].querySelector('input').value,
                tdMode: row.cells[2].querySelector('input').value,
                side: row.cells[3].querySelector('input').value,
                ordType: row.cells[4].querySelector('input').value,
                sz: row.cells[5].querySelector('input').value
            };
            const timestamp = new Date().toISOString();
            const body = JSON.stringify(orderDetails);

            const signature = await createSignature('POST', '/api/v5/trade/order', body, timestamp);  // Create signature

            const response = await fetch('https://www.okx.com/api/v5/trade/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'OK-ACCESS-KEY': apiKey,
                    'OK-ACCESS-PASSPHRASE': passphrase,
                    'OK-ACCESS-TIMESTAMP': timestamp,
                    'OK-ACCESS-SIGN': signature,
                },
                body: body  // Send the request body with order details
            });

            const result = await response.json();
            if (response.ok) {
				showAlert("Đặt lệnh thành công: " + row.cells[1].querySelector('input').value);
				thongBaoOrder();
            } else {
                showAlert("Error executing trade: " + result.message);  // Show error if trade execution fails
            }
        }
    });
	// tiếng còi báo động đặt lệnh thành công
		function thongBaoOrder() {
				if (window.getComputedStyle(row).backgroundColor !== "rgb(255, 255, 225)") {
					// Tạo âm thanh còi báo bằng Web Audio API
					const context = new (window.AudioContext || window.webkitAudioContext)();

					// Tạo nguồn âm thanh
					const oscillator = context.createOscillator();
					const gainNode = context.createGain();

					// Kết nối các node
					oscillator.connect(gainNode);
					gainNode.connect(context.destination);

					// Kiểu sóng sine tạo tiếng còi êm hơn
					oscillator.type = 'sine';

					// Bắt đầu thay đổi tần số để tạo hiệu ứng tiếng còi
					const startTime = context.currentTime;
					oscillator.frequency.setValueAtTime(400, startTime); // Tần số ban đầu
					oscillator.frequency.linearRampToValueAtTime(1000, startTime + 0.5); // Tăng lên 1000 Hz trong 0.5 giây
					oscillator.frequency.linearRampToValueAtTime(400, startTime + 1); // Giảm lại về 400 Hz trong 0.5 giây tiếp theo

					// Lặp lại hiệu ứng còi
					const loopDuration = 1; // Thời gian một chu kỳ
					const playDuration = 3; // Thời gian phát còi (3 giây)
					for (let i = 1; i < playDuration / loopDuration; i++) {
						oscillator.frequency.setValueAtTime(400, startTime + i * loopDuration);
						oscillator.frequency.linearRampToValueAtTime(1000, startTime + i * loopDuration + 0.5);
						oscillator.frequency.linearRampToValueAtTime(400, startTime + i * loopDuration + 1);
					}

					// Bắt đầu phát
					oscillator.start(startTime);
					oscillator.stop(startTime + playDuration); // Dừng sau 3 giây

					// Tắt âm lượng dần khi kết thúc
					gainNode.gain.setValueAtTime(1, startTime);
					gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + playDuration);

				}
			}
    // Function to add rows in the target price table (Layout 3)
    document.getElementById('addTargetRow').addEventListener('click', () => {
        const table = document.getElementById('targetTable').getElementsByTagName('tbody')[0];
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td><input type="number" value="-1"></td>
            <td><input type="text" value="BTCUSDT"></td>
            <td><span class="currentPrice">1</span></td>
            <td><input type="text" value="<"></td>
            <td><input type="number" value="0"></td>
            <td><span class="percentChange">0</span></td>
            <td><button class="deleteRow">Del</button></td>
        `;
    });
	//Lưu Dữ Liệu từ Bảng targetTable vào File JSON
		document.getElementById('saveAsTargetTable').addEventListener('click', () => {
		const table = document.getElementById('targetTable');
		const tbody = table.querySelector('tbody');
		const tableData = [];

		// Duyệt qua tất cả các hàng trong bảng và lấy dữ liệu từ các ô input và span
		for (let row of tbody.rows) {
			const rowData = {};

			// Lấy giá trị từ các ô input và span trong mỗi hàng
			rowData['Order'] = row.cells[0].querySelector('input').value; // Lấy giá trị từ ô input Order
			rowData['instId'] = row.cells[1].querySelector('input').value; // Lấy giá trị từ ô input instId
			rowData['currentPrice'] = row.cells[2].querySelector('.currentPrice').textContent; // Lấy giá trị từ span currentPrice
			rowData['operator'] = row.cells[3].querySelector('input').value; // Lấy giá trị từ ô input operator
			rowData['priceTarget'] = row.cells[4].querySelector('input').value; // Lấy giá trị từ ô input priceTarget
			rowData['percentChange'] = row.cells[5].querySelector('.percentChange').textContent; // Lấy giá trị từ span percentChange

			tableData.push(rowData); // Thêm dữ liệu hàng vào mảng
		}

		// Chuyển dữ liệu thành JSON
		const jsonData = JSON.stringify(tableData, null, 2);

		// Tạo một Blob từ dữ liệu JSON
		const blob = new Blob([jsonData], { type: 'application/json' });

		// Tạo URL tải về từ Blob
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'target_OKX.json'; // Tên tệp sẽ được tải về

		// Mô phỏng click vào liên kết để tải về tệp
		link.click();
	});
	//Load Dữ Liệu từ File JSON
			document.getElementById('loadTargetTable').addEventListener('change', (e) => {
			const file = e.target.files[0]; // Lấy tệp được chọn
			if (!file) return; // Nếu không có tệp nào được chọn thì thoát

			const reader = new FileReader();
			reader.onload = function(event) {
				try {
					// Đọc dữ liệu từ tệp JSON
					const data = JSON.parse(event.target.result);

					const table = document.getElementById('targetTable');
					const tbody = table.querySelector('tbody');

					// Xóa hết các hàng hiện tại trong bảng
					tbody.innerHTML = '';

					// Thêm dữ liệu từ JSON vào bảng
					data.forEach(rowData => {
						const newRow = tbody.insertRow();

						newRow.innerHTML = `
							<td><input type="number" value="${rowData.Order || -1}"></td>
							<td><input type="text" value="${rowData.instId || 'BTCUSDT'}"></td>
							<td><span class="currentPrice">${rowData.currentPrice || 0}</span></td>
							<td><input type="text" value="${rowData.operator || '<'}"></td>
							<td><input type="number" value="${rowData.priceTarget || 20000}"></td>
							<td><span class="percentChange">${rowData.percentChange || 0}</span></td>
							<td><button class="deleteRow">Del</button></td>
						`;
					});

				} catch (error) {
					alert("Lỗi khi tải tệp JSON: " + error.message);
				}
			};
			
			reader.readAsText(file); // Đọc tệp dưới dạng văn bản
		});

    // Fetch current price for a pair (simulated using Binance API)
    setInterval(() => {
        const rows = document.querySelectorAll('#targetTable tbody tr');
        rows.forEach(row => {
            const pair = row.cells[1].querySelector('input').value;
            fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`)
                .then(response => response.json())
                .then(data => {
                    row.cells[2].querySelector('.currentPrice').textContent = data.price;
                });
        });
    }, 1000);  // Update prices every second

    // Function to delete rows in the target price table
    document.getElementById('targetTable').addEventListener('click', (e) => {
        if (e.target.classList.contains('deleteRow')) {
            const row = e.target.closest('tr');
            row.remove();
        }
    });

    // Function to update percentage change in the target price table
    setInterval(() => {
        const rows = document.querySelectorAll('#targetTable tbody tr');
        rows.forEach(row => {
            const currentPrice = parseFloat(row.cells[2].querySelector('.currentPrice').textContent);
            const targetPrice = parseFloat(row.cells[4].querySelector('input').value);
            const percentChangeCell = row.cells[5].querySelector('.percentChange');

            if (currentPrice && targetPrice) {
                const percentChange = ((currentPrice - targetPrice) / targetPrice) * 100;
                percentChangeCell.textContent = percentChange.toFixed(2) + '%';
            }
        });
    }, 1000);  // Update percentage every second

    // Function to check conditions in the target price table and trigger actions in the order table
   	setInterval(() => {
    const targetRows = document.querySelectorAll('#targetTable tbody tr');
    const rows = document.querySelectorAll('#orderTable tbody tr');

    targetRows.forEach(targetRow => {
        // Kiểm tra nếu hàng hợp lệ và có đủ ô
        if (!targetRow || !targetRow.cells[3] || !targetRow.cells[4]) {
            console.warn("Invalid target row detected, skipping...");
            return; // Bỏ qua hàng không hợp lệ
        }

        const currentPrice = parseFloat(targetRow.cells[2]?.querySelector('.currentPrice')?.textContent || 0);
        const targetPrice = parseFloat(targetRow.cells[4]?.querySelector('input')?.value || 0);
        const logic = targetRow.cells[3]?.querySelector('input')?.value?.trim() || ""; // Logic là chuỗi
        const orderTaget = parseInt(targetRow.cells[0]?.querySelector('input')?.value || -1);
		const inputElement = targetRow?.cells[0]?.querySelector('input');

        // Kiểm tra logic và giá trị
        if ((logic === "<" && currentPrice < targetPrice) || (logic === ">" && currentPrice > targetPrice)) {
            rows.forEach((row, index) => {
                // Kiểm tra nếu hàng hợp lệ
                if (!row || !row.cells[0]) {
                    console.warn("Invalid order row detected, skipping...");
                    return; // Bỏ qua hàng không hợp lệ
                }

                const order = parseInt(row.cells[0]?.querySelector('input')?.value || -1);
                if (order === orderTaget) {
                    setTimeout(() => {
                        row.querySelector('.activateOrder')?.click(); // Kích hoạt nếu phần tử tồn tại
                    }, index * 300); // Độ trễ 0.3s
                }
            });
			
			if (inputElement) {
				inputElement.value = -2;
				thongBaoTaget();
			}
        }
    });
}, 1000);
// thông báo thảo điều kiện
			function thongBaoTaget() {
			// Tạo âm thanh còi báo bằng Web Audio API
			const context = new (window.AudioContext || window.webkitAudioContext)();

			// Tạo nguồn âm thanh
			const oscillator = context.createOscillator();
			const gainNode = context.createGain();

			// Kết nối các node
			oscillator.connect(gainNode);
			gainNode.connect(context.destination);

			// Kiểu sóng tạo âm thanh (square hoặc sine để tạo hiệu ứng thú vị hơn)
			oscillator.type = 'sine';

			// Tần số cao và thấp cho tiếng còi
			const lowFrequency = 600;
			const highFrequency = 1200;

			// Thời gian bắt đầu
			const startTime = context.currentTime;

			// Chu kỳ thay đổi tần số (giống tiếng còi xe cảnh sát)
			const cycleDuration = 0.4; // 0.4 giây mỗi chu kỳ (thay đổi giữa tần số cao và thấp)

			// Thời gian phát âm thanh tổng cộng
			const playDuration = 5; // 5 giây

			// Tạo hiệu ứng còi xe cảnh sát bằng cách lặp qua các chu kỳ
			for (let i = 0; i < playDuration / cycleDuration; i++) {
				const currentCycleStart = startTime + i * cycleDuration;

				// Tần số thấp trong nửa chu kỳ đầu
				oscillator.frequency.setValueAtTime(lowFrequency, currentCycleStart);

				// Tăng lên tần số cao trong nửa chu kỳ tiếp theo
				oscillator.frequency.setValueAtTime(highFrequency, currentCycleStart + cycleDuration / 2);
			}

			// Tắt âm thanh sau khi hết thời gian phát
			oscillator.start(startTime);
			oscillator.stop(startTime + playDuration);

			// Giảm âm lượng dần khi kết thúc
			gainNode.gain.setValueAtTime(1, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + playDuration);
		}
	// thông báo
	function showAlert(message) {
            const alertBox = document.createElement('div');
            alertBox.className = 'custom-alert';
            alertBox.textContent = message;
            document.body.appendChild(alertBox);

            // Hiển thị alert
            alertBox.style.display = 'block';

            // Tự động ẩn sau 1 giây
            setTimeout(() => {
                alertBox.style.display = 'none';
                alertBox.remove(); // Xóa phần tử khỏi DOM
            }, 1000);
        }
    // Function to create signature for OKX API requests
    async function createSignature(method, path, body, timestamp) {
            const encoder = new TextEncoder();
            const dataToSign = timestamp + method + path + body;
            const key = encoder.encode(secretKey);
            const data = encoder.encode(dataToSign);

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                key,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            );
            const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
            return btoa(String.fromCharCode(...new Uint8Array(signature)));
        }
});
