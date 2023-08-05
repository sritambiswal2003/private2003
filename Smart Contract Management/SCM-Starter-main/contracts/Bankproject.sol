// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NewBank {
    mapping(address => string) accountData;

    event FundsTransferred(uint256 amount);
    event DataUpdated(string value);

    function setAccountData(string memory _data) public {
        require(
            keccak256(abi.encodePacked(accountData[msg.sender])) !=
                keccak256(abi.encodePacked(_data)),
            "New data is same as old data"
        );
        accountData[msg.sender] = _data;

        emit DataUpdated(accountData[msg.sender]);
    }

    function getAccountData() public view returns (string memory) {
        return accountData[msg.sender];
    }

    error InsufficientBalanceError(uint256 balance, uint256 withdrawAmount);

    function transferEther(address payable _to) public payable {
        _to.transfer(msg.value);
        if (msg.sender.balance < msg.value)
            revert InsufficientBalanceError({
                balance: msg.sender.balance,
                withdrawAmount: msg.value
            });
        emit FundsTransferred(msg.value);
    }

    function getAccountBalance() public view returns (uint256) {
        return msg.sender.balance;
    }
}
