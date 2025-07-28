<div class="loading-overlay">
	<div class="loading-content">
		<div class="loading-indicator"></div>
		<div class="loading-text">Загрузка, ожидайте...</div>
	</div>
</div>

<style>
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		z-index: 100;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loading-indicator {
		width: 320px;
		height: 320px;
		background: url('https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_6631fab38bcdab100e7c214e_6634a992a228f13b4de1505c/orig')
			no-repeat center center;
		background-size: cover;
		border-radius: 50%;
	}

	.loading-text {
		margin-top: 20px;
		padding: 10px 20px;
		background-color: #1e293bc4;
		border-radius: 5px;
		color: #fff;
		font-size: 1.2em;
		text-align: center;
	}
</style>
