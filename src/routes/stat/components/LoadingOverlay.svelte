<div
	class="loading-overlay bg-opacity-75 fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900"
>
	<div class="loading-content">
		<div class="loading-indicator"></div>
		<div class="loading-text">Загрузка, ожидайте...</div>
	</div>
</div>

<style>
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

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		position: relative;
	}
</style>
